import { REVIEW_STEPS } from "@/lib/review-guidance";

export function ReviewWorkflowBanner() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-medium">Review workflow</p>
      <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-0 sm:divide-x sm:divide-border">
        {REVIEW_STEPS.map((step, i) => (
          <li key={step.key} className="flex flex-1 gap-2 sm:flex-col sm:px-3 sm:first:pl-0">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-medium">{step.label}</div>
              <div className="text-xs text-muted-foreground">{step.description}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
