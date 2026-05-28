import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export function ActionFeedback({
  type,
  message,
  onDismiss,
}: {
  type: "ok" | "err";
  message: string;
  onDismiss?: () => void;
}) {
  const ok = type === "ok";
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
        ok
          ? "border-[color-mix(in_oklab,var(--color-success)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_8%,transparent)]"
          : "border-[color-mix(in_oklab,var(--color-destructive)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_8%,transparent)]"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-destructive)]" />
      )}
      <p className={`min-w-0 flex-1 ${ok ? "text-foreground" : "text-[var(--color-destructive)]"}`}>
        {message}
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
