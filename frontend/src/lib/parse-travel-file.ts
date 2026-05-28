/** Parse and validate a corporate-travel upload file (JSON only). */
export async function parseTravelUploadFile(file: File): Promise<unknown[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
    throw new Error(
      "Corporate travel must be a JSON file (.json), not a spreadsheet. " +
        "Use your travel platform’s JSON export, or copy the structure from sample_data/travel_sample.json.",
    );
  }

  if (!name.endsWith(".json")) {
    throw new Error(
      `“${file.name}” is not a JSON file. For corporate travel, upload a .json export only.`,
    );
  }

  const text = (await file.text()).trim();
  if (!text) {
    throw new Error("The file is empty. Choose a JSON file that contains booking data.");
  }

  if (looksLikeCsv(text)) {
    throw new Error(
      "This file looks like CSV (comma-separated), but travel uploads require JSON. " +
        "Re-export from Concur/Navan as JSON, or use sample_data/travel_sample.json as a template.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `Could not read “${file.name}” as JSON. ` +
        "Expected an array of bookings, or an object like { \"bookings\": [...] }. " +
        "See sample_data/travel_sample.json for a valid example.",
    );
  }

  const list = Array.isArray(parsed)
    ? parsed
    : (parsed as { bookings?: unknown }).bookings;

  if (!Array.isArray(list)) {
    throw new Error(
      "Invalid travel JSON structure. Use either a list of bookings at the root, " +
        'or an object with a "bookings" array.',
    );
  }

  if (list.length === 0) {
    throw new Error("The JSON file has no bookings. Add at least one flight, hotel, or ground trip.");
  }

  return list;
}

function looksLikeCsv(text: string): boolean {
  const firstLine = text.split(/\r?\n/)[0]?.trim().toLowerCase() ?? "";
  if (!firstLine.includes(",")) return false;
  const csvHeaders = [
    "booking_id",
    "booking_type",
    "origin",
    "destination",
    "uuid",
    "segment",
  ];
  return csvHeaders.some((h) => firstLine.startsWith(h) || firstLine.includes(`,${h}`));
}
