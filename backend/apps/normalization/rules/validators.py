from apps.lookups.models import LookupAirport, LookupPlant
from apps.normalization.models import NormalizedActivity, ValidationIssue
from apps.normalization.rules.base import RuleResult


def run_validation_rules(activity: NormalizedActivity) -> list[ValidationIssue]:
    results: list[RuleResult] = []

    if not activity.activity_date and not activity.activity_start:
        results.append(RuleResult("missing_date", "Activity date is missing", "error", True))

    if activity.quantity_value is None:
        results.append(RuleResult("missing_quantity", "Quantity is missing", "error", True))

    if not activity.scope_category:
        results.append(RuleResult("missing_scope", "Scope category could not be mapped", "error", True))

    if activity.facility_or_plant_code:
        exists = LookupPlant.objects.filter(
            tenant=activity.tenant,
            plant_code=activity.facility_or_plant_code,
            is_active=True,
        ).exists()
        if not exists:
            results.append(
                RuleResult(
                    "unknown_plant",
                    f"Unknown plant code: {activity.facility_or_plant_code}",
                    "error",
                    True,
                )
            )

    if activity.activity_category == NormalizedActivity.ActivityCategory.FLIGHT:
        raw = activity.raw_record.raw_payload
        inner = raw.get("payload") if isinstance(raw.get("payload"), dict) else raw
        origin = inner.get("origin_iata") or inner.get("origin")
        dest = inner.get("destination_iata") or inner.get("destination")
        if origin and not LookupAirport.objects.filter(iata_code=origin.upper()).exists():
            results.append(RuleResult("unknown_airport", f"Unknown origin airport: {origin}", "error", True))
        if dest and not LookupAirport.objects.filter(iata_code=dest.upper()).exists():
            results.append(RuleResult("unknown_airport", f"Unknown destination airport: {dest}", "error", True))

    activity.validation_issues.all().delete()
    issues = []
    for r in results:
        issues.append(
            ValidationIssue.objects.create(
                activity=activity,
                severity=r.severity,
                issue_code=r.issue_code,
                message=r.message,
                is_blocking=r.is_blocking,
            )
        )
    return issues
