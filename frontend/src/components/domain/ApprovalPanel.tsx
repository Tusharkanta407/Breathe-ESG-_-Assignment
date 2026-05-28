import { useState } from "react";
import { approveActivity, rejectActivity } from "@/api/review";
import type { NormalizedActivity } from "@/types";

interface Props {
  activity: NormalizedActivity;
  onUpdated: () => void;
}

export default function ApprovalPanel({ activity, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const hasBlocking = activity.validation_issues.some((i) => i.is_blocking);

  async function handle(decision: "approve" | "reject") {
    setLoading(true);
    try {
      if (decision === "approve") await approveActivity(activity.id);
      else await rejectActivity(activity.id);
      onUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  if (activity.is_locked) return <span className="text-xs text-muted-foreground">Locked</span>;

  return (
    <div className="flex gap-1">
      <button
        type="button"
        className="rounded-md bg-[var(--color-success)] px-2 py-1 text-xs text-white disabled:opacity-40"
        disabled={loading || hasBlocking}
        onClick={() => handle("approve")}
      >
        Approve
      </button>
      <button
        type="button"
        className="rounded-md border px-2 py-1 text-xs disabled:opacity-40"
        disabled={loading}
        onClick={() => handle("reject")}
      >
        Reject
      </button>
    </div>
  );
}
