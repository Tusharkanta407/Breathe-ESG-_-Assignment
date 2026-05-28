import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Upload,
  History,
  ShieldCheck,
  GitBranch,
  Search,
  Bell,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { OrganizationSelector } from "@/components/shared/OrganizationSelector";
import { cn } from "@/lib/utils";
import { useTenantStore } from "@/stores/tenantStore";
import { useTenantBootstrap } from "@/hooks/useTenantBootstrap";
import { fetchSummary } from "@/api/review";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/upload", label: "Data upload", icon: Upload },
  { to: "/ingestion", label: "Ingestion History", icon: History },
  { to: "/review", label: "Review Queue", icon: ShieldCheck, badgeKey: "pending" as const },
  { to: "/traceability", label: "Traceability", icon: GitBranch },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { location } = useRouterState();
  const current = nav.find((n) => n.to === location.pathname) ?? nav[0];
  const tenantId = useTenantStore((s) => s.tenantId);
  useTenantBootstrap();

  const { data: summary } = useQuery({
    queryKey: ["summary", tenantId],
    queryFn: fetchSummary,
    enabled: !!tenantId,
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <BrandLogo size="md" showWordmark linkToHome />
        </div>
        <nav className="flex-1 px-2 py-3">
          <div className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Workflow
          </div>
          <ul className="space-y-0.5">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {"badgeKey" in item && summary && summary.pending > 0 ? (
                      <span className="rounded-md bg-[color-mix(in_oklab,var(--color-warning)_22%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[oklch(0.45_0.12_75)]">
                        {summary.pending}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              KN
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">Kira Nguyen</div>
              <div className="text-xs text-muted-foreground">ESG Analyst</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-5 backdrop-blur">
          <BrandLogo size="sm" linkToHome className="md:hidden shrink-0" />
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">ESG Operations</span>
            <span className="text-border-strong">/</span>
            <span className="text-foreground font-medium">{current.label}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <OrganizationSelector />
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search rows, batches…"
                className="h-8 w-64 rounded-md border border-input bg-background pl-8 pr-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            <button className="relative grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted">
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[var(--color-destructive)]" />
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
