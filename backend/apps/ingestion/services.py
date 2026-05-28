from django.utils import timezone

from apps.audit.services import log_event
from apps.ingestion.models import IngestionBatch, RawRecord
from apps.ingestion.parsers import parse_sap_csv, parse_travel_payload, parse_utility_csv, parse_utility_zip
from apps.normalization.pipeline import run_normalization_for_batch
from apps.tenants.models import DataSource


def _log_batch_event(batch: IngestionBatch, event_type: str, payload: dict | None = None):
    log_event(
        tenant=batch.tenant,
        entity_type="ingestion_batch",
        entity_id=str(batch.id),
        event_type=event_type,
        actor_type="system",
        actor_id="ingestion",
        payload=payload or {},
    )


def create_batch(tenant, data_source: DataSource, trigger_type: str, input_ref: str = "") -> IngestionBatch:
    return IngestionBatch.objects.create(
        tenant=tenant,
        data_source=data_source,
        trigger_type=trigger_type,
        status=IngestionBatch.Status.PENDING,
        input_ref=input_ref,
    )


def ingest_sap_csv(batch: IngestionBatch, file_bytes: bytes) -> IngestionBatch:
    batch.status = IngestionBatch.Status.RUNNING
    batch.started_at = timezone.now()
    batch.save(update_fields=["status", "started_at"])

    try:
        rows = parse_sap_csv(file_bytes)
        for row in rows:
            key = str(row.get("document_number") or row.get("_row_index"))
            RawRecord.objects.update_or_create(
                batch=batch,
                source_row_key=key,
                defaults={
                    "raw_payload": row,
                    "parse_status": RawRecord.ParseStatus.PARSED,
                },
            )
        batch.status = IngestionBatch.Status.COMPLETED
    except Exception as exc:
        batch.status = IngestionBatch.Status.FAILED
        batch.error_summary = str(exc)
    finally:
        batch.finished_at = timezone.now()
        batch.save(update_fields=["status", "error_summary", "finished_at"])

    if batch.status == IngestionBatch.Status.COMPLETED:
        count = run_normalization_for_batch(batch)
        _log_batch_event(batch, "ingestion_completed", {"normalized_count": count})
    else:
        _log_batch_event(batch, "ingestion_failed", {"error": batch.error_summary})
    return batch


def ingest_utility_file(batch: IngestionBatch, file_bytes: bytes, is_zip: bool = False) -> IngestionBatch:
    batch.status = IngestionBatch.Status.RUNNING
    batch.started_at = timezone.now()
    batch.save(update_fields=["status", "started_at"])

    try:
        rows = parse_utility_zip(file_bytes) if is_zip else parse_utility_csv(file_bytes)
        for idx, row in enumerate(rows, start=1):
            key = str(row.get("meter_id") or row.get("interval_start") or idx)
            RawRecord.objects.update_or_create(
                batch=batch,
                source_row_key=key,
                defaults={
                    "raw_payload": row,
                    "parse_status": RawRecord.ParseStatus.PARSED,
                },
            )
        batch.status = IngestionBatch.Status.COMPLETED
    except Exception as exc:
        batch.status = IngestionBatch.Status.FAILED
        batch.error_summary = str(exc)
    finally:
        batch.finished_at = timezone.now()
        batch.save(update_fields=["status", "error_summary", "finished_at"])

    if batch.status == IngestionBatch.Status.COMPLETED:
        count = run_normalization_for_batch(batch)
        _log_batch_event(batch, "ingestion_completed", {"normalized_count": count})
    else:
        _log_batch_event(batch, "ingestion_failed", {"error": batch.error_summary})
    return batch


def ingest_travel_payload(batch: IngestionBatch, payload: list) -> IngestionBatch:
    batch.status = IngestionBatch.Status.RUNNING
    batch.started_at = timezone.now()
    batch.save(update_fields=["status", "started_at"])

    try:
        rows = parse_travel_payload(payload)
        for row in rows:
            RawRecord.objects.update_or_create(
                batch=batch,
                source_row_key=row["source_row_key"],
                defaults={
                    "raw_payload": row,
                    "parse_status": RawRecord.ParseStatus.PARSED,
                },
            )
        batch.status = IngestionBatch.Status.COMPLETED
    except Exception as exc:
        batch.status = IngestionBatch.Status.FAILED
        batch.error_summary = str(exc)
    finally:
        batch.finished_at = timezone.now()
        batch.save(update_fields=["status", "error_summary", "finished_at"])

    if batch.status == IngestionBatch.Status.COMPLETED:
        count = run_normalization_for_batch(batch)
        _log_batch_event(batch, "ingestion_completed", {"normalized_count": count})
    else:
        _log_batch_event(batch, "ingestion_failed", {"error": batch.error_summary})
    return batch
