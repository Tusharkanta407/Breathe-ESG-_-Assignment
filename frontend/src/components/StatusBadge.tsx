import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "error" | "info" | "muted" | "accent";

const toneStyles: Record<Tone, string> = {
  success:
    "bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] text-[var(--color-success)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-success)_25%,transparent)]",
  warning:
    "bg-[color-mix(in_oklab,var(--color-warning)_18%,transparent)] text-[oklch(0.45_0.12_75)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-warning)_35%,transparent)]",
  error:
    "bg-[color-mix(in_oklab,var(--color-destructive)_12%,transparent)] text-[var(--color-destructive)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-destructive)_25%,transparent)]",
  info: "bg-[color-mix(in_oklab,var(--color-info)_14%,transparent)] text-[var(--color-info)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-info)_25%,transparent)]",
  muted: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  accent:
    "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-accent)_25%,transparent)]",
};

export function StatusBadge({
  tone = "muted",
  children,
  className,
  dot = true,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium tracking-tight",
        toneStyles[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "approved":
    case "completed":
      return "success";
    case "flagged":
    case "pending":
    case "processing":
    case "warning":
      return "warning";
    case "rejected":
    case "blocked":
    case "failed":
    case "error":
      return "error";
    case "info":
      return "info";
    default:
      return "muted";
  }
}
