import type { ValidationIssue } from "@/types";
import { StatusBadge, statusTone } from "@/components/StatusBadge";

interface Props {
  issue: ValidationIssue;
}

export default function ValidationIssueTag({ issue }: Props) {
  return (
    <StatusBadge tone={statusTone(issue.severity)} dot={false} className="mr-1">
      <span title={issue.message}>{issue.issue_code}</span>
    </StatusBadge>
  );
}
