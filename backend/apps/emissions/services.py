from decimal import Decimal

from apps.emissions.models import EmissionComputation
from apps.normalization.models import NormalizedActivity

# Baseline prototype factors (kg CO2e per unit) — replace with tenant-configurable catalog later.
BASELINE_FACTORS = {
    ("purchased_electricity", "kWh"): ("grid_electricity_default", Decimal("0.42")),
    ("fuel", "L"): ("diesel_combustion_default", Decimal("2.68")),
    ("flight", "km"): ("flight_short_haul_default", Decimal("0.15")),
    ("hotel", "night"): ("hotel_stay_default", Decimal("15.0")),
    ("ground_transport", "trip"): ("ground_trip_default", Decimal("5.0")),
}


def compute_emissions(activity: NormalizedActivity) -> EmissionComputation | None:
    if not activity.is_locked:
        return None

    category = activity.activity_category
    unit = (activity.quantity_unit_canonical or "").lower()
    key = (category, unit)
    if key not in BASELINE_FACTORS:
        return None

    factor_key, factor_rate = BASELINE_FACTORS[key]
    qty = activity.quantity_value_canonical or Decimal("0")
    co2e = qty * factor_rate

    return EmissionComputation.objects.create(
        activity=activity,
        factor_key=factor_key,
        factor_source="baseline_v1",
        co2e_kg=co2e,
    )
