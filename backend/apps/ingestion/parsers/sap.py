import csv
import io
from typing import Any


HEADER_ALIASES = {
    "plant_code": {"plant_code", "werk", "plant"},
    "posting_date": {"posting_date", "buchungsdatum", "date"},
    "quantity": {"quantity", "menge", "volume_or_mass"},
    "unit": {"unit", "einheit"},
    "cost_center": {"cost_center", "kostenstelle"},
}


def _normalize_header(header: str) -> str:
    key = header.strip().lower().replace(" ", "_")
    for canonical, aliases in HEADER_ALIASES.items():
        if key in aliases:
            return canonical
    return key


def parse_sap_csv(file_bytes: bytes) -> list[dict[str, Any]]:
    """Parse SAP/Ariba-style CSV into list of row dicts with canonical keys."""
    text = file_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    rows: list[dict[str, Any]] = []
    for idx, row in enumerate(reader, start=1):
        normalized = {_normalize_header(k): v for k, v in row.items() if k}
        normalized["_row_index"] = idx
        rows.append(normalized)
    return rows
