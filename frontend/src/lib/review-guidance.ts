/** Analyst-facing guidance for validation issue codes. */
export const ISSUE_GUIDANCE: Record<
  string,
  { label: string; explanation: string; resolveHint?: string }
> = {
  unknown_plant: {
    label: "Unknown facility",
    explanation:
      "This plant or site code is not in your organization's facility lookup.",
    resolveHint: "Register the facility below, then re-check validation.",
  },
  unknown_airport: {
    label: "Unknown airport",
    explanation: "Origin or destination airport is missing from the global airport reference.",
    resolveHint: "Reject the row or ask the client to correct the travel export.",
  },
  missing_date: {
    label: "Missing date",
    explanation: "No activity date could be parsed from the source row.",
    resolveHint: "Reject and request a corrected source file from the client.",
  },
  missing_quantity: {
    label: "Missing quantity",
    explanation: "Fuel, energy, or travel amount is empty.",
    resolveHint: "Reject and request a corrected source file from the client.",
  },
  missing_scope: {
    label: "Unmapped scope",
    explanation: "Could not assign Scope 1, 2, or 3 from source data.",
    resolveHint: "Reject or fix the source mapping with your ESG lead.",
  },
};

export const REVIEW_STEPS = [
  { key: "ingest", label: "Ingested", description: "Data received from SAP, utility, or travel" },
  { key: "validate", label: "Validated", description: "Normalized and checked against rules" },
  { key: "review", label: "In review", description: "Analyst checks flags and source context" },
  { key: "approve", label: "Approved", description: "Signed off for reporting" },
  { key: "locked", label: "Locked", description: "Immutable audit record; emissions computed" },
] as const;
