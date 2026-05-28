from decimal import Decimal, InvalidOperation

UNIT_TO_CANONICAL = {
    "l": ("L", Decimal("1")),
    "liter": ("L", Decimal("1")),
    "gal": ("L", Decimal("3.78541")),
    "kwh": ("kWh", Decimal("1")),
    "kw": ("kWh", None),  # requires interval duration for conversion
    "kg": ("kg", Decimal("1")),
    "t": ("kg", Decimal("1000")),
}


def normalize_unit(value, unit_raw: str, interval_hours: Decimal | None = None) -> tuple[Decimal | None, str, str | None]:
    if value is None or not unit_raw:
        return None, "", "missing_unit"
    key = unit_raw.strip().lower()
    if key not in UNIT_TO_CANONICAL:
        return None, unit_raw, "unsupported_unit"
    canonical_unit, factor = UNIT_TO_CANONICAL[key]
    try:
        val = Decimal(str(value))
    except (InvalidOperation, TypeError):
        return None, unit_raw, "invalid_quantity"
    if factor is None:
        if interval_hours is None:
            return None, unit_raw, "missing_interval_for_kw"
        return val * interval_hours, canonical_unit, None
    return val * factor, canonical_unit, None
