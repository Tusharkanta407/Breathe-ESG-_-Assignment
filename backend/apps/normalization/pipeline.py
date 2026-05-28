from datetime import datetime

from dateutil import parser as date_parser

from apps.ingestion.models import IngestionBatch, RawRecord
from apps.normalization.converters import normalize_unit
from apps.normalization.models import NormalizedActivity
from apps.normalization.rules import run_validation_rules
from apps.tenants.models import DataSource


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    return date_parser.parse(str(value), dayfirst=True).date()


def _map_scope_and_category(source_type: str, payload: dict) -> tuple[str, str]:
    if source_type == DataSource.SourceType.SAP:
        if payload.get("fuel_type"):
            return NormalizedActivity.ScopeCategory.SCOPE1, NormalizedActivity.ActivityCategory.FUEL
        return NormalizedActivity.ScopeCategory.SCOPE3, NormalizedActivity.ActivityCategory.PROCUREMENT
    if source_type == DataSource.SourceType.UTILITY:
        return NormalizedActivity.ScopeCategory.SCOPE2, NormalizedActivity.ActivityCategory.PURCHASED_ELECTRICITY
    booking_type = (payload.get("booking_type") or "").lower()
    if "flight" in booking_type:
        return NormalizedActivity.ScopeCategory.SCOPE3, NormalizedActivity.ActivityCategory.FLIGHT
    if "hotel" in booking_type:
        return NormalizedActivity.ScopeCategory.SCOPE3, NormalizedActivity.ActivityCategory.HOTEL
    return NormalizedActivity.ScopeCategory.SCOPE3, NormalizedActivity.ActivityCategory.GROUND_TRANSPORT


def _effective_payload(source_type: str, raw_payload: dict) -> dict:
    """Flatten travel wrapper rows {booking_type, payload:{...}} for normalization."""
    if source_type != DataSource.SourceType.TRAVEL:
        return raw_payload
    inner = raw_payload.get("payload") if isinstance(raw_payload.get("payload"), dict) else {}
    merged = {**inner, **{k: v for k, v in raw_payload.items() if k != "payload"}}
    return merged


def normalize_raw_record(raw: RawRecord) -> NormalizedActivity:
    batch = raw.batch
    source_type = batch.data_source.source_type
    payload = _effective_payload(source_type, raw.raw_payload)

    scope, category = _map_scope_and_category(source_type, payload if source_type != DataSource.SourceType.TRAVEL else raw.raw_payload)
    activity_date = _parse_date(
        payload.get("posting_date")
        or payload.get("delivery_date")
        or payload.get("interval_start")
        or payload.get("departure_ts")
        or payload.get("checkin_date")
    )
    qty = payload.get("quantity") or payload.get("reading_value") or payload.get("volume_or_mass") or payload.get("distance_km") or payload.get("nights")
    unit = payload.get("unit") or payload.get("reading_unit") or ("km" if payload.get("distance_km") else "night" if payload.get("nights") else "")
    canonical_val, canonical_unit, _ = normalize_unit(qty, unit)

    activity, _ = NormalizedActivity.objects.update_or_create(
        raw_record=raw,
        defaults={
            "tenant": batch.tenant,
            "source_type": source_type,
            "source_entity_type": category,
            "activity_date": activity_date,
            "scope_category": scope,
            "activity_category": category,
            "quantity_value": qty,
            "quantity_unit_raw": unit,
            "quantity_value_canonical": canonical_val,
            "quantity_unit_canonical": canonical_unit or "",
            "facility_or_plant_code": payload.get("plant_code") or payload.get("meter_id") or "",
            "cost_center": payload.get("cost_center") or "",
            "currency": payload.get("currency") or "",
            "amount": payload.get("net_amount") or payload.get("total_amount"),
        },
    )
    run_validation_rules(activity)
    return activity


def run_normalization_for_batch(batch: IngestionBatch) -> int:
    count = 0
    for raw in batch.raw_records.filter(parse_status=RawRecord.ParseStatus.PARSED):
        normalize_raw_record(raw)
        count += 1
    return count
