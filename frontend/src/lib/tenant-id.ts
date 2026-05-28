/** RFC-style UUID v4 (hex segments). Rejects corrupted IDs from old manual header edits. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidTenantId(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_RE.test(id.trim());
}
