"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../../../lib/auth-client";
import { Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/dialog";

type PayoutRequest = {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
  rejectionReason: string | null;
  proofUrl: string | null;
};

type FinanceData = {
  availableBalance: number;
  platformFee: number;
  minPayout: number;
  history: PayoutRequest[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processed: "Processed",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FinancePage() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<FinanceData>({
    queryKey: ["finance", activeOrg?.id],
    queryFn: () => fetch("/api/finance").then((r) => r.json()),
    enabled: !!activeOrg?.id,
  });

  const [open, setOpen] = useState(false);
  const [amountStr, setAmountStr] = useState("");

  const hasPendingRequest = data?.history.some((h) => h.status === "pending") ?? false;

  const mutation = useMutation({
    mutationFn: (amount: number) =>
      fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      setOpen(false);
      setAmountStr("");
    },
  });

  const availableBalance = data?.availableBalance ?? 0;
  const platformFee = data?.platformFee ?? 0;
  const minPayout = data?.minPayout ?? 0;
  const history = data?.history ?? [];

  const amount = Number(amountStr || 0);
  const netReceive = Math.max(0, amount - platformFee);
  const belowMinBalance = availableBalance < minPayout;

  const validationError = (() => {
    if (!amountStr || amount <= 0) return null;
    if (amount < minPayout) return `Minimal pencairan ${formatCurrency(minPayout)}`;
    if (amount <= platformFee) return "Jumlah harus lebih besar dari biaya platform";
    if (amount > availableBalance) return "Jumlah melebihi saldo tersedia";
    return null;
  })();

  const canConfirm =
    amount > 0 &&
    amount >= minPayout &&
    amount > platformFee &&
    amount <= availableBalance &&
    !mutation.isPending;

  function openModal() {
    setAmountStr("");
    mutation.reset();
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your earnings and payout requests.
        </p>
      </div>

      <div className="rounded-lg border p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Wallet className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="text-2xl font-semibold tracking-tight">
              {isLoading ? "—" : formatCurrency(availableBalance)}
            </p>
            {platformFee > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Biaya platform {formatCurrency(platformFee)} per pencairan
              </p>
            )}
          </div>
        </div>
        <button
          onClick={openModal}
          disabled={isLoading || availableBalance <= 0 || hasPendingRequest}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Request Payout
        </button>
      </div>

      {hasPendingRequest && (
        <p className="text-sm text-amber-600">
          A payout request is pending. You can request again once it&apos;s processed.
        </p>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) mutation.reset(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Saldo tersedia</span>
              <span className="font-medium">{formatCurrency(availableBalance)}</span>
            </div>

            {belowMinBalance ? (
              <p className="text-sm text-amber-600">
                Saldo belum mencapai minimal pencairan {formatCurrency(minPayout)}.
              </p>
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jumlah pencairan</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      Rp
                    </span>
                    <input
                      inputMode="numeric"
                      value={amountStr ? Number(amountStr).toLocaleString("id-ID") : ""}
                      onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                      className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setAmountStr(String(availableBalance))}
                    className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimal {formatCurrency(minPayout)}
                  {platformFee > 0 &&
                    ` · Biaya platform ${formatCurrency(platformFee)} · Anda menerima ${formatCurrency(netReceive)}`}
                </p>
                {validationError && (
                  <p className="text-xs text-destructive">{validationError}</p>
                )}
              </div>
            )}

            {mutation.isError && (
              <p className="text-sm text-destructive">{mutation.error as string}</p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate(amount)}
              disabled={!canConfirm}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Requesting…" : "Konfirmasi"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h2 className="text-base font-medium mb-3">Payout History</h2>
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">No payout requests yet.</p>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {history.map((req) => (
              <div key={req.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(req.amount)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {req.bankName} · {req.accountNumber} · {req.accountHolderName}
                  </p>
                  {req.status === "rejected" && req.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {req.rejectionReason}</p>
                  )}
                  {req.status === "processed" && req.proofUrl && (
                    <a
                      href={req.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#2a8af6] hover:underline mt-1 inline-block"
                    >
                      View receipt
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[req.status] ?? req.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(req.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
