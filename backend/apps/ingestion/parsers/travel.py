from typing import Any


def parse_travel_payload(payload: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Normalize Concur/Navan-style booking list into row dicts."""
    rows = []
    for item in payload:
        booking_id = item.get("booking_id") or item.get("uuid") or item.get("id")
        booking_type = (item.get("booking_type") or item.get("bookingType") or "").lower()
        segments = item.get("segments") or [item]
        for seg_idx, seg in enumerate(segments):
            source_row_key = f"{booking_id}:{seg_idx}"
            rows.append(
                {
                    "source_row_key": source_row_key,
                    "booking_id": booking_id,
                    "booking_type": booking_type,
                    "payload": seg if isinstance(seg, dict) else item,
                }
            )
    return rows
