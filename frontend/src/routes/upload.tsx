import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  FileArchive,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { uploadSap, uploadUtility, syncTravel } from "@/api/ingestion";
import { TenantBanner } from "@/components/shared/TenantBanner";
import { parseTravelUploadFile } from "@/lib/parse-travel-file";
import { useTenantStore } from "@/stores/tenantStore";
export const Route = createFileRoute("/upload")({
  head: () => ({ meta: [{ title: "Data upload · BreathESG" }] }),
  component: UploadCenter,
});

type UploadKind = "sap" | "utility" | "travel";

const sources: {
  kind: UploadKind;
  title: string;
  description: string;
  formats: string[];
  accept: string;
  icon: React.ElementType;
}[] = [
  {
    kind: "sap",
    title: "SAP — fuel & procurement",
    description:
      "Flat-file export from SAP or Ariba. Handles mixed units, plant codes, and regional column names.",
    formats: ["CSV"],
    accept: ".csv",
    icon: FileText,
  },
  {
    kind: "utility",
    title: "Utility — electricity",
    description:
      "Portal download from your facilities team. Single CSV or a ZIP of meter readings.",
    formats: ["CSV", "ZIP"],
    accept: ".csv,.zip",
    icon: FileArchive,
  },
  {
    kind: "travel",
    title: "Corporate travel",
    description:
      "JSON export only (not CSV). Array of bookings from Concur, Navan, or similar — use travel_sample.json as a template.",
    formats: ["JSON only"],
    accept: ".json,application/json",
    icon: FileJson,
  },
];

const SOURCE_TITLE: Record<UploadKind, string> = {
  sap: "SAP fuel & procurement",
  utility: "Utility electricity",
  travel: "Corporate travel",
};

function UploadCenter() {
  const tenantId = useTenantStore((s) => s.tenantId);
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingKind, setPendingKind] = useState<UploadKind | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
    kind?: UploadKind;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ kind, file }: { kind: UploadKind; file: File }) => {
      if (kind === "sap") return uploadSap(file);
      if (kind === "utility") return uploadUtility(file);
      const list = await parseTravelUploadFile(file);
      return syncTravel(list);
    },
    onSuccess: (batch, { kind, file }) => {
      const rows = batch.row_count ?? 0;
      setMessage({
        type: "ok",
        kind,
        text:
          batch.status === "failed"
            ? `Upload failed for ${file.name}. See Ingestion History for details.`
            : `${SOURCE_TITLE[kind]} uploaded successfully — ${rows} ${rows === 1 ? "record" : "records"} imported and queued for review.`,
      });
      setActiveFile(null);
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (err: Error) => {
      setMessage({ type: "err", text: err.message });
      setActiveFile(null);
    },
  });

  function pickFile(kind: UploadKind) {
    if (!tenantId) {
      setMessage({
        type: "err",
        text: "Select your organization in the header before uploading.",
      });
      return;
    }
    setPendingKind(kind);
    fileRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingKind) return;

    const extError = validateExtension(file, pendingKind);
    if (extError) {
      setMessage({ type: "err", text: extError });
      setPendingKind(null);
      return;
    }

    setMessage(null);
    setActiveFile(file.name);
    mutation.mutate({ kind: pendingKind, file });
    setPendingKind(null);
  }

  return (
    <div className="space-y-6">
      <TenantBanner />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept={presetsAccept(pendingKind)}
        onChange={onFileSelected}
      />

      <div>
        <h1 className="text-xl font-semibold tracking-tight">Data upload</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Bring client emissions data into BreathESG. Choose a source, upload a
          file, then review normalized activities before sign-off.
        </p>
      </div>

      {message && (
        <ResultBanner message={message} onReview={() => router.navigate({ to: "/review" })} />
      )}

      {mutation.isPending && activeFile && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 shrink-0 animate-spin text-[var(--color-accent)]" />
          <span>
            Processing <span className="font-medium text-foreground">{activeFile}</span>
            … validating and preparing rows for review.
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {sources.map((source) => (
          <SourceCard
            key={source.kind}
            source={source}
            disabled={!tenantId || mutation.isPending}
            onUpload={() => pickFile(source.kind)}
          />
        ))}
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-medium">After upload</h2>
        <ol className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <li className="flex gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
              1
            </span>
            <span>Files are parsed and matched to your organization&apos;s data sources.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
              2
            </span>
            <span>Rows are normalized to Scope 1/2/3 activities with validation flags.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
              3
            </span>
            <span>
              Analysts approve or reject in the{" "}
              <Link to="/review" className="text-[var(--color-accent)] hover:underline">
                Review Queue
              </Link>
              .
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}

function presetsAccept(kind: UploadKind | null) {
  return sources.find((s) => s.kind === kind)?.accept;
}

function validateExtension(file: File, kind: UploadKind): string | null {
  const name = file.name.toLowerCase();
  if (kind === "sap" && !name.endsWith(".csv")) {
    return "SAP uploads must be a .csv file.";
  }
  if (kind === "utility" && !name.endsWith(".csv") && !name.endsWith(".zip")) {
    return "Utility uploads must be a .csv or .zip file.";
  }
  if (kind === "travel" && !name.endsWith(".json")) {
    return "Corporate travel uploads must be a .json file (not CSV). See sample_data/travel_sample.json.";
  }
  return null;
}

function SourceCard({
  source,
  disabled,
  onUpload,
}: {
  source: (typeof sources)[number];
  disabled: boolean;
  onUpload: () => void;
}) {
  const Icon = source.icon;
  return (
    <article className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <div className="flex size-10 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{source.title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
        {source.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {source.formats.map((f) => (
          <span
            key={f}
            className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {f}
          </span>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onUpload}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UploadCloud className="size-4" />
        Choose file
      </button>
    </article>
  );
}

function ResultBanner({
  message,
  onReview,
}: {
  message: { type: "ok" | "err"; text: string };
  onReview: () => void;
}) {
  const ok = message.type === "ok";
  return (
    <div
      className={`flex flex-wrap items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
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
        {message.text}
      </p>
      {ok && (
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onReview}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-success)] px-3 py-1.5 text-xs font-medium text-white"
          >
            Review queue <ArrowRight className="size-3" />
          </button>
          <Link
            to="/ingestion"
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Ingestion history
          </Link>
        </div>
      )}
    </div>
  );
}
