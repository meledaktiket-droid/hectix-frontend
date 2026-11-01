"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Copy, Check, Upload, X, CheckCircle2 } from "lucide-react";

type PayoutDetail = {
  id: string;
  organizationId: string;
  orgName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  status: "pending" | "processed" | "rejected";
  createdAt: string;
  processedAt: string | null;
  rejectionReason: string | null;
  proofUrl: string | null;
  processedByName: string | null;
};

type StatusStyle = { bg: string; text: string; dot: string; label: string };

const STATUS_STYLES: Record<string, StatusStyle> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Pending" },
  processed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Processed" },
  rejected:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     label: "Rejected" },
};

const FALLBACK_STYLE: StatusStyle = { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" };

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? FALLBACK_STYLE;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy"
      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6]"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function BankRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium mt-0.5 break-words ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

export default function PayoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: payout,
    isLoading: loading,
    isError: fetchError,
    refetch,
  } = useQuery<PayoutDetail>({
    queryKey: ["admin-payout", id],
    queryFn: ({ signal }) =>
      fetch(`/api/payouts/${id}`, { signal }).then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      }),
  });

  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const processMutation = useMutation({
    mutationFn: (proof: string) =>
      fetch(`/api/payouts/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: proof }),
      }).then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          throw new Error(d?.error ?? "Couldn't mark as paid — try again.");
        }
      }),
    onSuccess: () => {
      setProofUrl(null);
      queryClient.invalidateQueries({ queryKey: ["admin-payout", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (e) => {
      setProcessError(e instanceof Error ? e.message : "Couldn't mark as paid — try again.");
    },
  });
  const processing = processMutation.isPending;

  const rejectMutation = useMutation({
    mutationFn: (rejectReason: string) =>
      fetch(`/api/payouts/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      }).then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          throw new Error(d?.error ?? "Couldn't reject — try again.");
        }
      }),
    onSuccess: () => {
      setRejecting(false);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-payout", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (e) => {
      setRejectError(e instanceof Error ? e.message : "Couldn't reject — try again.");
    },
  });
  const submittingReject = rejectMutation.isPending;

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          folder: "payout-proofs",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Upload failed. Please try again.");
      }
      const { url, publicUrl } = await res.json();
      const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error("Upload failed. Please try again.");
      setProofUrl(publicUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleMarkPaid() {
    if (!proofUrl || processing) return;
    setProcessError(null);
    processMutation.mutate(proofUrl);
  }

  function handleReject() {
    if (!reason.trim() || submittingReject) return;
    setRejectError(null);
    rejectMutation.mutate(reason.trim());
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
          href="/payouts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <ArrowLeft className="size-4" /> Payouts
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0 text-red-500" />
          <span>
            Couldn&apos;t load this payout.{" "}
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

  if (!payout) return <p className="text-sm text-muted-foreground">Payout not found.</p>;

  const isPending = payout.status === "pending";

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-3">
        <Link
          href="/payouts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <ArrowLeft className="size-4" /> Payouts
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/orgs/${payout.organizationId}`}
              className="text-sm text-[#2a8af6] hover:underline focus-visible:outline-none focus-visible:underline"
            >
              {payout.orgName}
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Payout request</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Requested {new Date(payout.createdAt).toLocaleDateString("id-ID")}
            </p>
          </div>
          <StatusBadge status={payout.status} />
        </div>
      </div>

      <div className="rounded-lg border p-5 space-y-5">
        <div>
          <p className="text-xs text-muted-foreground">Amount to transfer</p>
          <p className="text-2xl font-semibold mt-0.5">{formatIDR(payout.amount)}</p>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">Send transfer to</p>
          <BankRow label="Bank" value={payout.bankName} />
          <BankRow label="Account number" value={payout.accountNumber} mono />
          <BankRow label="Account holder" value={payout.accountHolderName} />
        </div>
      </div>

      {isPending && (
        <div className="space-y-6">
          <div className="rounded-lg border p-5 space-y-4">
            <div>
              <p className="text-sm font-medium">Mark as paid</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload the transfer receipt screenshot, then confirm.
              </p>
            </div>

            {proofUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proofUrl}
                  alt="Transfer proof"
                  className="max-h-48 rounded-lg border object-contain"
                />
                <button
                  type="button"
                  onClick={() => setProofUrl(null)}
                  aria-label="Remove proof"
                  className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background shadow-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6]"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground hover:bg-muted/40 transition-colors">
                <Upload className="size-4" />
                {uploading ? "Uploading..." : "Upload transfer proof"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}

            {uploadError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="size-3.5 shrink-0" />
                {uploadError}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={!proofUrl || uploading || processing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CheckCircle2 className="size-4" />
                {processing ? "Saving..." : "Mark as Paid"}
              </button>
              {processError && (
                <span className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {processError}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-5 space-y-4">
            {!rejecting ? (
              <button
                type="button"
                onClick={() => { setRejecting(true); setRejectError(null); }}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Reject
              </button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Reason <span className="text-muted-foreground/60">(shown to the organizer)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Bank account details could not be verified."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={!reason.trim() || submittingReject}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {submittingReject ? "Rejecting..." : "Confirm rejection"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRejecting(false); setReason(""); setRejectError(null); }}
                    className="rounded-lg border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cancel
                  </button>
                  {rejectError && (
                    <span className="flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {rejectError}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {payout.status === "processed" && (
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4 shrink-0" />
            Paid
          </div>
          <p className="text-sm text-muted-foreground">
            Paid by {payout.processedByName ?? "an admin"}
            {payout.processedAt ? ` on ${formatDateTime(payout.processedAt)}` : ""}.
          </p>
          {payout.proofUrl && (
            <a href={payout.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payout.proofUrl}
                alt="Transfer receipt"
                className="max-h-64 rounded-lg border object-contain hover:opacity-90 transition-opacity"
              />
            </a>
          )}
        </div>
      )}

      {payout.status === "rejected" && (
        <div className="rounded-lg border p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <X className="size-4 shrink-0" />
            Rejected
          </div>
          <p className="text-sm text-muted-foreground">
            Rejected by {payout.processedByName ?? "an admin"}
            {payout.processedAt ? ` on ${formatDateTime(payout.processedAt)}` : ""}.
          </p>
          {payout.rejectionReason && (
            <div className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <span className="font-medium">Reason:</span> {payout.rejectionReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
