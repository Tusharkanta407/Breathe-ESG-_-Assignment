import csv
import io
import zipfile
from typing import Any


def parse_utility_csv(file_bytes: bytes) -> list[dict[str, Any]]:
    """Parse utility portal CSV (single file)."""
    text = file_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return [dict(row) for row in reader]


def parse_utility_zip(file_bytes: bytes) -> list[dict[str, Any]]:
    """Parse ZIP containing one or more CSV files; prefer 1DAY then 1H."""
    rows: list[dict[str, Any]] = []
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
        names = sorted(zf.namelist())
        preferred = [n for n in names if "1DAY" in n.upper()] or [n for n in names if "1H" in n.upper()] or names
        for name in preferred:
            if not name.lower().endswith(".csv"):
                continue
            with zf.open(name) as f:
                rows.extend(parse_utility_csv(f.read()))
    return rows
