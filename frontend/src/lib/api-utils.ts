/** Unwrap DRF list responses (plain array or paginated). */
export function unwrapList<T>(data: T[] | { results: T[] }): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export function formatScope(scope: string): string {
  if (!scope) return "—";
  if (scope.startsWith("scope")) {
    return `Scope ${scope.replace("scope", "")}`;
  }
  return scope;
}

export function formatSourceType(source: string): string {
  const map: Record<string, string> = {
    sap: "SAP",
    utility: "Utility",
    travel: "Travel",
  };
  return map[source] ?? source;
}
