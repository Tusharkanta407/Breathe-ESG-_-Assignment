import type { NormalizedActivity } from "@/types";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import ValidationIssueTag from "./ValidationIssueTag";
import ApprovalPanel from "./ApprovalPanel";
import { formatScope, formatSourceType } from "@/lib/api-utils";

interface Props {
  activity: NormalizedActivity;
  onUpdated: () => void;
}

export default function ActivityRow({ activity, onUpdated }: Props) {
  return (
    <tr>
      <td>{activity.activity_category}</td>
      <td>{formatSourceType(activity.source_type)}</td>
      <td>
        <StatusBadge tone="muted" dot={false}>
          {formatScope(activity.scope_category)}
        </StatusBadge>
      </td>
      <td>{activity.activity_date ?? "—"}</td>
      <td>
        {activity.quantity_value_canonical ?? "—"} {activity.quantity_unit_canonical}
      </td>
      <td>
        {activity.validation_issues.map((i) => (
          <ValidationIssueTag key={i.id} issue={i} />
        ))}
      </td>
      <td>
        <StatusBadge tone={statusTone(activity.review_status)}>
          {activity.review_status}
        </StatusBadge>
      </td>
      <td>
        <ApprovalPanel activity={activity} onUpdated={onUpdated} />
      </td>
    </tr>
  );
}
