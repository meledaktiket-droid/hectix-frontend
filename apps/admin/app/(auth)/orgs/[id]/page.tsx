"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, User, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

type Member = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

type HistoryEntry = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  actorType: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

type OrgDetail = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  statusNote: string | null;
  allowResubmit: boolean;
  createdAt: string;
  metadata: string | null;
  verificationData: string | null;
  members: Member[];
  history: HistoryEntry[];
};

type Transition = {
  status: string;
  label: string;
  style: "success" | "danger" | "warning" | "neutral";
  needsNote?: boolean;
};

const TRANSITIONS: Record<string, Transition[]> = {
  pending: [
    { status: "review",    label: "Start review", style: "neutral" },
    { status: "active",    label: "Approve",      style: "success" },
    { status: "rejected",  label: "Reject",       style: "danger",  needsNote: true },
  ],
  review: [
    { status: "active",   label: "Approve", style: "success" },
    { status: "rejected", label: "Reject",  style: "danger",  needsNote: true },
  ],
  active: [
    { status: "suspended", label: "Suspend", style: "warning", needsNote: true },
  ],
  rejected: [
    { status: "active",  label: "Reinstate", style: "success" },
    { status: "review",  label: "Re-review", style: "neutral" },
  ],
  suspended: [
    { status: "active",   label: "Reinstate", style: "success" },
    { status: "rejected", label: "Reject",    style: "danger",  needsNote: true },
  ],
};

const TRANSITION_STYLES: Record<Transition["style"], { idle: string; selected: string; confirm: string }> = {
  success: {
    idle:    "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100",
    selected:"bg-emerald-600 text-white border border-emerald-600 active:bg-emerald-700",
    confirm: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
  },
  danger: {
    idle:    "border border-red-200 text-red-700 hover:bg-red-50 active:bg-red-100",
    selected:"bg-red-600 text-white border border-red-600 active:bg-red-700",
    confirm: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  },
  warning: {
    idle:    "border border-orange-200 text-orange-700 hover:bg-orange-50 active:bg-orange-100",
    selected:"bg-orange-500 text-white border border-orange-500 active:bg-orange-600",
    confirm: "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700",
  },
  neutral: {
    idle:    "border border-input text-foreground hover:bg-muted active:bg-muted/80",
    selected:"bg-foreground text-background border border-foreground active:opacity-90",
    confirm: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
  },
};

const STATUS_OPTIONS = [
  { value: "pending",   label: "Pending" },
  { value: "review",    label: "In Review" },
  { value: "active",    label: "Active" },
  { value: "rejected",  label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  review:    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  active:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
  suspended: { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function parse(raw: string | null) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5 break-words">{value}</p>
    </div>
  );
}

function initials(name: string) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["day", 86400],
    ["hour", 3600], ["minute", 60], ["second", 1],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diffSec) >= secs || unit === "second") {
      return rtf.format(-Math.round(diffSec / secs), unit);
    }
  }
  return "just now";
}

function actorLabel(entry: HistoryEntry, orgName: string): string {
  if (entry.actorType === "organizer") return orgName;
  return entry.actorName ?? "Unknown user";
}

function contextVerb(entry: HistoryEntry): string | null {
  if (entry.actorType !== "organizer") return null;
  if (entry.fromStatus === null) return "registered";
  if (entry.fromStatus === "rejected" && entry.toStatus === "review") return "resubmitted";
  return null;
}

function StatusHistory({ org }: { org: OrgDetail }) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <p className="text-sm font-medium">Status history</p>
      {org.history.length === 0 ? (
        <p className="text-xs text-muted-foreground">No history recorded yet.</p>
      ) : (
        <ol className="space-y-4">
          {org.history.map((h) => {
            const verb = contextVerb(h);
            return (
              <li key={h.id} className="flex gap-3">
                <div className="mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {h.fromStatus && (
                      <>
                        <StatusBadge status={h.fromStatus} />
                        <span className="text-muted-foreground">→</span>
                      </>
                    )}
                    <StatusBadge status={h.toStatus} />
                    <span
                      className="ml-auto text-xs text-muted-foreground"
                      title={new Date(h.createdAt).toLocaleString()}
                    >
                      {timeAgo(h.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium" title={h.actorEmail ?? undefined}>{actorLabel(h, org.name)}</span>
                    <span className="text-muted-foreground"> · {h.actorType}</span>
                    {verb && <span className="text-muted-foreground"> ({verb})</span>}
                  </p>
                  {h.note && (
                    <p className="text-sm text-muted-foreground italic">"{h.note}"</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: org,
    isLoading: loading,
    isError: fetchError,
    refetch,
  } = useQuery<OrgDetail>({
    queryKey: ["admin-org", id],
    queryFn: ({ signal }) =>
      fetch(`/api/orgs/${id}`, { signal }).then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      }),
  });

  const [selectedAction, setSelectedAction] = useState<Transition | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [allowResubmit, setAllowResubmit] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const statusMutation = useMutation({
    mutationFn: (action: Transition) =>
      fetch(`/api/orgs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action.status,
          statusNote: actionNote || null,
          allowResubmit: action.status === "rejected" ? allowResubmit : false,
        }),
      }).then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-org", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orgs"] });

      setSelectedAction(null);
      setActionNote("");
      setAllowResubmit(false);

      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      setSaveSuccess(true);
      successTimerRef.current = setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: () => {
      setSaveError("Couldn't save — try again.");
    },
  });

  const saving = statusMutation.isPending;

  function selectAction(action: Transition) {
    if (selectedAction?.status === action.status) {
      setSelectedAction(null);
      setActionNote("");
      setAllowResubmit(false);
    } else {
      setSelectedAction(action);
      setActionNote("");
      setAllowResubmit(false);
      setSaveError(null);
    }
  }

  function handleConfirm() {
    if (!org || !selectedAction || saving) return;
    setSaveError(null);
    statusMutation.mutate(selectedAction);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <Link
          href="/orgs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <ArrowLeft className="size-4" /> Organizations
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0 text-red-500" />
          <span>
            Couldn't load this organization.{" "}
            <button
              onClick={() => refetch()}
              className="underline hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Try again
            </button>
          </span>
        </div>
      </div>
    );
  }

  if (!org) return <p className="text-sm text-muted-foreground">Organization not found.</p>;

  const meta = parse(org.metadata);
  const verification = parse(org.verificationData);
  const isEntity = meta?.type === "entity";
  const transitions = TRANSITIONS[org.status] ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/orgs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <ArrowLeft className="size-4" /> Organizations
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-bold">
              {org.name[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight truncate">{org.name}</h1>
              <p className="text-sm text-muted-foreground truncate">{org.slug}</p>
            </div>
          </div>
          <StatusBadge status={org.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] items-start">

        <div className="space-y-4">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                {isEntity
                  ? <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  : <User className="size-4 shrink-0 text-muted-foreground" />}
                {isEntity ? "Business details" : "Personal details"}
              </div>
              <div className="space-y-3">
                <Field label="Type" value={isEntity ? (meta?.businessType || "Business") : "Personal"} />
                <Field label="Phone" value={meta?.phone} />
                {isEntity && <Field label="Website" value={meta?.website} />}
                <Field label="Member since" value={new Date(org.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-medium">Members ({org.members.length})</p>
              <div className="space-y-3">
                {org.members.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No members yet.</p>
                ) : (
                  org.members.map((m) => (
                    <div key={m.id} className="flex min-w-0 items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold overflow-hidden">
                        {m.image ? <img src={m.image} alt={m.name} className="size-7 object-cover" /> : initials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground capitalize">{m.role}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
              Verification data
            </div>
            {!verification ? (
              <p className="text-xs text-muted-foreground">No verification data submitted yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {isEntity ? (
                    <>
                      <Field label="NIB" value={verification.nib} />
                      <Field label="PIC Name" value={verification.picName} />
                      <Field label="PIC KTP" value={verification.picKtpNumber} />
                    </>
                  ) : (
                    <Field label="KTP Number" value={verification.ktpNumber} />
                  )}
                  <Field label="Bank" value={verification.bankName} />
                  <Field label="Account Number" value={verification.accountNumber} />
                  <Field label="Account Holder" value={verification.accountHolderName} />
                </div>
                {(verification.ktpFileKey || verification.nibFileKey || verification.picKtpFileKey) && (
                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    {verification.ktpFileKey && (
                      <a
                        href={`/api/files/${verification.ktpFileKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted active:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        KTP Photo ↗
                      </a>
                    )}
                    {verification.nibFileKey && (
                      <a
                        href={`/api/files/${verification.nibFileKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted active:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        NIB Document ↗
                      </a>
                    )}
                    {verification.picKtpFileKey && (
                      <a
                        href={`/api/files/${verification.picKtpFileKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted active:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        PIC KTP Photo ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <StatusHistory org={org} />

        </div>

        <div className="sticky top-6">
          <div className="rounded-lg border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Change status</p>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="size-3.5" /> Status updated
                </span>
              )}
            </div>

            {org.statusNote && (
              <div className="rounded-md bg-muted px-3 py-2 space-y-0.5">
                <p className="text-xs text-muted-foreground">Current note</p>
                <p className="text-sm">{org.statusNote}</p>
              </div>
            )}

            {transitions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No further actions available.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {transitions.map((t) => {
                    const styles = TRANSITION_STYLES[t.style];
                    const isSelected = selectedAction?.status === t.status;
                    return (
                      <button
                        key={t.status}
                        onClick={() => selectAction(t)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSelected ? styles.selected : styles.idle}`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {selectedAction && (
                  <div className="space-y-3 border-t pt-4">
                    {selectedAction.needsNote && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">
                          Reason <span className="text-muted-foreground/60">(shown to the organizer)</span>
                        </label>
                        <input
                          type="text"
                          value={actionNote}
                          onChange={(e) => setActionNote(e.target.value)}
                          placeholder="e.g. KTP number does not match provided name."
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}

                    {selectedAction.status === "rejected" && (
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allowResubmit}
                          onChange={(e) => setAllowResubmit(e.target.checked)}
                          className="size-4 rounded border-input accent-primary"
                        />
                        <span className="text-sm">Allow organizer to resubmit</span>
                      </label>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${TRANSITION_STYLES[selectedAction.style].confirm}`}
                      >
                        {saving ? "Saving..." : `Confirm: ${selectedAction.label}`}
                      </button>
                      {saveError && (
                        <span className="flex items-center gap-1.5 text-xs text-red-600">
                          <AlertCircle className="size-3.5 shrink-0" />
                          {saveError}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
