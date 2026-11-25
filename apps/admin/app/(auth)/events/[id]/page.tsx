"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  QrCode,
  Download,
  Plus,
  UserPlus,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";

const BUYERS_PAGE_SIZE = 10;

type TicketStat = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  revenue: number;
  validDates?: string[];
};

type BuyerItem = {
  ticketTypeName: string;
  quantity: number;
};

type Buyer = {
  orderId: string;
  status: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  items: BuyerItem[];
};

type EventDetail = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  venueName: string | null;
  city: string | null;
  status: string;
  organizationId: string;
  organizationName: string;
};

type PhysicalBatch = {
  id: string;
  eventId: string;
  requestId: string;
  name: string;
  accessType: string;
  ticketTypeId: string | null;
  purpose: string;
  activationMode: string;
  quantity: number;
  merchantRef: string | null;
  generatedByName: string;
  generatedByEmail: string;
  generatedAt: string;
  exportedByName: string | null;
  exportedByEmail: string | null;
  exportedAt: string | null;
  exportCount: number;
  stockCount: number;
  activeCount: number;
  voidCount: number;
};

type BatchHistoryEntry = {
  id: string;
  action: "generated" | "exported";
  batchId: string;
  batchName: string;
  accessType: string;
  quantity: number;
  purpose: string;
  note: string | null;
  actorType: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

type EventVolunteer = {
  id: string;
  eventId: string;
  userId: string | null;
  userName: string | null;
  email: string;
  role: string;
  status: string;
  invitedByName: string;
  invitedByEmail: string;
  createdAt: string;
  acceptedAt: string | null;
};

type VolunteerHistoryEntry = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  volunteerEmail: string;
  volunteerName: string | null;
  note: string | null;
  actorType: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diffSec) >= secs || unit === "second") {
      return rtf.format(-Math.round(diffSec / secs), unit);
    }
  }
  return "baru saja";
}

function BatchActionBadge({ action }: { action: "generated" | "exported" }) {
  const isGen = action === "generated";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isGen ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
      }`}
    >
      <span className={`size-1.5 rounded-full ${isGen ? "bg-emerald-500" : "bg-blue-500"}`} />
      {isGen ? "Generated" : "Exported Excel"}
    </span>
  );
}

const DEFAULT_VOLUNTEER_STYLE = {
  label: "Pending Invite",
  bg: "bg-amber-50",
  text: "text-amber-700",
  dot: "bg-amber-500",
};

const VOLUNTEER_STATUS_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: DEFAULT_VOLUNTEER_STYLE,
  accepted: { label: "Diterima (Aktif)", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected: { label: "Ditolak", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  revoked: { label: "Revoked", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function VolunteerStatusBadge({ status }: { status: string }) {
  const s = VOLUNTEER_STATUS_STYLES[status] ?? DEFAULT_VOLUNTEER_STYLE;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function BatchHistoryCard({ history }: { history: BatchHistoryEntry[] }) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <p className="text-sm font-medium">Riwayat generate &amp; unduh tiket</p>
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada riwayat aktivitas batch tiket.</p>
      ) : (
        <ol className="space-y-4">
          {history.map((h) => (
            <li key={h.id} className="flex gap-3">
              <div className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <BatchActionBadge action={h.action} />
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                    {h.accessType}
                  </span>
                  <span className="text-xs font-medium text-foreground">{h.batchName}</span>
                  <span
                    className="ml-auto text-xs text-muted-foreground"
                    title={new Date(h.createdAt).toLocaleString("id-ID")}
                  >
                    {timeAgo(h.createdAt)}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="font-medium" title={h.actorEmail ?? undefined}>
                    {h.actorName || h.actorEmail || "Unknown user"}
                  </span>
                  <span className="text-muted-foreground"> · {h.actorType}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    ({h.action === "generated" ? `generate ${h.quantity} tiket` : "cetak excel QR"})
                  </span>
                </p>
                {h.note && <p className="text-xs text-muted-foreground italic">&ldquo;{h.note}&rdquo;</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function VolunteerHistoryCard({ history }: { history: VolunteerHistoryEntry[] }) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <p className="text-sm font-medium">Riwayat invite &amp; revoke volunteer</p>
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada riwayat aktivitas volunteer.</p>
      ) : (
        <ol className="space-y-4">
          {history.map((h) => {
            const actionLabel =
              h.toStatus === "revoked"
                ? "revoked"
                : h.toStatus === "rejected"
                  ? "declined invite"
                  : h.fromStatus === "pending" && h.toStatus === "accepted"
                    ? "accepted invite"
                    : h.fromStatus === "revoked" || h.fromStatus === "rejected"
                      ? "re-invited"
                      : "invited";
            return (
              <li key={h.id} className="flex gap-3">
                <div className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {h.fromStatus && (
                      <>
                        <VolunteerStatusBadge status={h.fromStatus} />
                        <span className="text-muted-foreground">→</span>
                      </>
                    )}
                    <VolunteerStatusBadge status={h.toStatus} />
                    <span className="text-xs font-medium text-foreground">
                      {h.volunteerName ? `${h.volunteerName} (${h.volunteerEmail})` : h.volunteerEmail}
                    </span>
                    <span
                      className="ml-auto text-xs text-muted-foreground"
                      title={new Date(h.createdAt).toLocaleString("id-ID")}
                    >
                      {timeAgo(h.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium" title={h.actorEmail ?? undefined}>
                      {h.actorName || h.actorEmail || "Unknown user"}
                    </span>
                    <span className="text-muted-foreground"> · {h.actorType}</span>
                    <span className="text-muted-foreground"> ({actionLabel})</span>
                  </p>
                  {h.note && <p className="text-xs text-muted-foreground italic">&ldquo;{h.note}&rdquo;</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Lunas", cls: "bg-green-50 text-green-700 ring-green-600/20" },
    pending_payment: { label: "Menunggu", cls: "bg-amber-50 text-amber-700 ring-amber-600/20" },
    cancelled: { label: "Dibatalkan", cls: "bg-muted text-muted-foreground ring-border" },
    expired: { label: "Kedaluwarsa", cls: "bg-muted text-muted-foreground ring-border" },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground ring-border" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"main" | "batches" | "volunteers">("main");

  const [generateOpen, setGenerateOpen] = useState(false);
  const [accessType, setAccessType] = useState("DAY_1");
  const [quantity, setQuantity] = useState("100");
  const [batchName, setBatchName] = useState("");
  const [purpose, setPurpose] = useState("ALLOCATION");
  const [activationMode, setActivationMode] = useState("READY_ON_GENERATE");
  const [generating, setGenerating] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [downloadingBatchId, setDownloadingBatchId] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [volunteerError, setVolunteerError] = useState<string | null>(null);
  const [removingVolunteerId, setRemovingVolunteerId] = useState<string | null>(null);
  const [confirmRemoveVolunteer, setConfirmRemoveVolunteer] = useState<EventVolunteer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-event", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memuat data event");
      }
      return res.json();
    },
  });

  const [togglingSessionId, setTogglingSessionId] = useState<string | null>(null);

  const {
    data: batchesData,
    error: batchesQueryError,
  } = useQuery<{
    batches: PhysicalBatch[];
    history: BatchHistoryEntry[];
    sessions?: {
      id: string;
      name: string;
      startsAt: string;
      endsAt: string;
      allowReentry: boolean;
      quotaLimit: number;
      currentInside: number;
      uniqueEntered: number;
    }[];
    summary?: { enteredCount: number; totalCapacity: number };
  }>({
    queryKey: ["admin-event-batches", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/batches`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memuat batch tiket fisik");
      }
      return res.json();
    },
  });

  const {
    data: volunteersData,
    error: volunteersQueryError,
  } = useQuery<{ volunteers: EventVolunteer[]; history: VolunteerHistoryEntry[] }>({
    queryKey: ["admin-event-volunteers", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/volunteers`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memuat daftar volunteer");
      }
      return res.json();
    },
  });

  const ev: EventDetail | undefined = data?.event;
  const stats: TicketStat[] = data?.stats ?? [];
  const buyers: Buyer[] = data?.buyers ?? [];
  const batches: PhysicalBatch[] = batchesData?.batches ?? [];
  const batchHistory: BatchHistoryEntry[] = batchesData?.history ?? [];
  const sessions = batchesData?.sessions ?? [];
  const batchSummary = batchesData?.summary;

  async function handleToggleReentry(sessionId: string, nextVal: boolean) {
    setBatchError(null);
    setTogglingSessionId(sessionId);
    try {
      const res = await fetch(`/api/events/${id}/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowReentry: nextVal }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengubah opsi re-entry");
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-event-batches", id] });
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Gagal mengubah opsi re-entry");
    } finally {
      setTogglingSessionId(null);
    }
  }
  const volunteers: EventVolunteer[] = volunteersData?.volunteers ?? [];
  const volunteerHistory: VolunteerHistoryEntry[] = volunteersData?.history ?? [];

  const selectedStat = stats.find((t) => t.name === accessType);
  const missingTicketDates = Boolean(
    selectedStat && (!selectedStat.validDates || selectedStat.validDates.length === 0)
  );

  async function handleGenerateBatch(e: React.FormEvent) {
    e.preventDefault();
    setBatchError(null);
    if (missingTicketDates) {
      setBatchError("Tanggal berlaku untuk tipe tiket ini belum diisi oleh Organizer.");
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1 || qty > 10000) {
      setBatchError("Jumlah tiket harus antara 1 sampai 10.000");
      return;
    }
    setGenerating(true);
    try {
      const requestId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `batch-${Date.now()}`;
      const res = await fetch(`/api/events/${id}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          name: batchName.trim(),
          accessType,
          ticketTypeId: selectedStat?.id,
          purpose,
          activationMode,
          quantity: qty,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBatchError(json.error || "Gagal membuat batch tiket fisik");
        return;
      }
      setBatchName("");
      setGenerateOpen(false);
      setActiveTab("batches");
      queryClient.invalidateQueries({ queryKey: ["admin-event-batches", id] });
    } catch {
      setBatchError("Gagal menghubungi server");
    } finally {
      setGenerating(false);
    }
  }

  async function handleExportBatch(batch: PhysicalBatch) {
    setDownloadingBatchId(batch.id);
    setBatchError(null);
    try {
      const res = await fetch(`/api/events/${id}/batches/${batch.id}/export`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengunduh file Excel QR");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hectix-qr-${batch.accessType.toLowerCase()}-${batch.id.slice(0, 8)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ["admin-event-batches", id] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunduh file Excel QR";
      setBatchError(msg);
    } finally {
      setDownloadingBatchId(null);
    }
  }

  async function handleInviteVolunteer(e: React.FormEvent) {
    e.preventDefault();
    setVolunteerError(null);
    const email = volunteerEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setVolunteerError("Email volunteer wajib diisi dengan benar");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch(`/api/events/${id}/volunteers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setVolunteerError(json.error || "Gagal mengundang volunteer scanner");
        return;
      }
      setVolunteerEmail("");
      setInviteOpen(false);
      setActiveTab("volunteers");
      queryClient.invalidateQueries({ queryKey: ["admin-event-volunteers", id] });
    } catch {
      setVolunteerError("Gagal menghubungi server");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveVolunteer(volunteerId: string) {
    setRemovingVolunteerId(volunteerId);
    setVolunteerError(null);
    try {
      const res = await fetch(`/api/events/${id}/volunteers/${volunteerId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setVolunteerError(json.error || "Gagal mencabut akses volunteer");
        return;
      }
      setConfirmRemoveVolunteer(null);
      queryClient.invalidateQueries({ queryKey: ["admin-event-volunteers", id] });
    } catch {
      setVolunteerError("Gagal menghubungi server");
    } finally {
      setRemovingVolunteerId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="space-y-4">
        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Events
        </Link>
        <p className="text-sm text-muted-foreground">Event tidak ditemukan.</p>
      </div>
    );
  }

  const totalSold = stats.reduce((sum, t) => sum + t.sold, 0);
  const totalCapacity = stats.reduce((sum, t) => sum + t.capacity, 0);
  const totalRevenue = stats.reduce((sum, t) => sum + t.revenue, 0);

  const totalPages = Math.max(1, Math.ceil(buyers.length / BUYERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedBuyers = buyers.slice((currentPage - 1) * BUYERS_PAGE_SIZE, currentPage * BUYERS_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />
        Events
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{ev.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ev.status === "published" ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-muted text-muted-foreground ring-border"}`}>
              {ev.status === "published" ? "Published" : "Draft"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {formatDate(ev.startsAt)}
              {ev.endsAt && ` – ${formatDate(ev.endsAt)}`}
            </span>
            {(ev.venueName || ev.city) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {[ev.venueName, ev.city].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={() => {
              setBatchError(null);
              setPurpose("ALLOCATION");
              setActivationMode("READY_ON_GENERATE");
              setGenerateOpen(true);
            }}
          >
            <Plus className="size-4 mr-1.5" />
            Generate Tiket
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setVolunteerError(null);
              setInviteOpen(true);
            }}
          >
            <UserPlus className="size-4 mr-1.5" />
            Invite Volunteer
          </Button>
          <Link
            href={`/orgs/${ev.organizationId}`}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Building2 className="size-4" />
            {ev.organizationName}
          </Link>
        </div>
      </div>

      <div className="border-b">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab("main")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "main"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            Utama
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("batches")}
            className={`inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "batches"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <span>Daftar Tiket</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {batches.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("volunteers")}
            className={`inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "volunteers"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <span>List Volunteer</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {volunteers.length}
            </span>
          </button>
        </nav>
      </div>

      {activeTab === "main" ? (
        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-sm font-medium">Tiket</h2>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tipe</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Harga</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Terjual</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">
                        Belum ada tiket.
                      </td>
                    </tr>
                  ) : (
                    stats.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{t.name}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {t.price === 0 ? "Gratis" : formatCurrency(t.price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {t.sold}
                          <span className="text-muted-foreground"> / {t.capacity}</span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(t.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {stats.length > 0 && (
                  <tfoot>
                    <tr className="border-t bg-muted/50">
                      <td className="px-4 py-2.5 font-medium">Total</td>
                      <td />
                      <td className="px-4 py-2.5 text-right font-medium">
                        {totalSold}
                        <span className="text-muted-foreground font-normal"> / {totalCapacity}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(totalRevenue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Pembeli</h2>
              {buyers.length > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="size-3" />
                  {buyers.length} order
                </span>
              )}
            </div>
            <div className="rounded-lg border overflow-hidden">
              {buyers.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  Belum ada pembeli.
                </div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tiket</th>
                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Tgl Order</th>
                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pagedBuyers.map((b) => (
                        <tr key={b.orderId} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{b.buyerName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{b.buyerEmail}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {b.items.map((item, i) => (
                              <span key={`${b.orderId}-${item.ticketTypeName}`}>
                                {item.ticketTypeName} ×{item.quantity}
                                {i < b.items.length - 1 && ", "}
                              </span>
                            ))}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {formatDate(b.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <OrderStatusBadge status={b.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
                      <span>
                        Menampilkan {(currentPage - 1) * BUYERS_PAGE_SIZE + 1}–{Math.min(currentPage * BUYERS_PAGE_SIZE, buyers.length)} dari {buyers.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="rounded-md border p-1 hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                          aria-label="Sebelumnya"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <span className="px-1">Hal {currentPage} / {totalPages}</span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="rounded-md border p-1 hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                          aria-label="Berikutnya"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "batches" ? (
        <div className="space-y-4">
          {batchSummary && (
            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Ringkasan Kehadiran Tiket Fisik (Masuk / Keluar)</p>
                <p className="text-lg font-bold tabular-nums">
                  {batchSummary.enteredCount} / {batchSummary.totalCapacity}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Total Kapasitas: {batchSummary.totalCapacity}
              </span>
            </div>
          )}

          {sessions.length > 0 && (() => {
            const activeReentryCount = sessions.filter((s) => s.allowReentry).length;
            const fmtRange = (startsAt?: string, endsAt?: string) => {
              if (!startsAt) return null;
              const sDay = startsAt.slice(0, 10);
              const eDay = endsAt ? endsAt.slice(0, 10) : sDay;
              const fmt = (d: string) =>
                new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                });
              return sDay === eDay ? fmt(sDay) : `${fmt(sDay)} – ${fmt(eDay)}`;
            };

            return (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">Pengaturan Sesi &amp; Re-entry (Khusus Admin)</h3>
                    <p className="text-xs text-muted-foreground">
                      Aktifkan Re-entry jika pengunjung boleh keluar dan masuk gate kembali di sesi tiket tersebut.
                    </p>
                  </div>
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                    {activeReentryCount}/{sessions.length} Sesi Re-entry
                  </span>
                </div>

                <div className="divide-y rounded-md border overflow-hidden">
                  {sessions.map((ses) => {
                    const cleanName = ses.name.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, "") || ses.name;
                    const dateRange = fmtRange(ses.startsAt, ses.endsAt);

                    return (
                      <div
                        key={ses.id}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-2 sm:gap-4 px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium truncate">{cleanName}</p>
                          {dateRange && (
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {dateRange}
                            </span>
                          )}
                        </div>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          Di dalam: {ses.currentInside} &middot; Unik masuk: {ses.uniqueEntered}
                        </p>
                        <label className="inline-flex items-center justify-between sm:justify-end gap-2 cursor-pointer text-xs font-medium">
                          <span className={ses.allowReentry ? "text-emerald-700" : "text-muted-foreground"}>
                            {ses.allowReentry ? "Re-entry Aktif" : "Sekali Masuk"}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={ses.allowReentry}
                            disabled={togglingSessionId === ses.id}
                            onClick={() => handleToggleReentry(ses.id, !ses.allowReentry)}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                              ses.allowReentry ? "bg-emerald-600" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                ses.allowReentry ? "translate-x-4.5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {batchesQueryError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {(batchesQueryError as Error).message || "Gagal memuat batch tiket fisik"}
            </p>
          )}

          {batchError && !generateOpen && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {batchError}
            </p>
          )}

          <div className="rounded-lg border overflow-hidden">
            {batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <QrCode className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">Belum ada tiket fisik yang di-generate</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Klik tombol Generate Tiket untuk membuat kode QR fisik dan mengunduh file Excel siap cetak.
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setBatchError(null);
                    setPurpose("ALLOCATION");
                    setActivationMode("READY_ON_GENERATE");
                    setGenerateOpen(true);
                  }}
                >
                  <Plus className="size-4 mr-1.5" />
                  Generate Tiket
                </Button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama Batch</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Jenis Tiket</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tujuan &amp; Mode</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Status Kode</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Dibuat Oleh</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Aksi Excel</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{b.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                          {b.accessType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {b.purpose} • {b.activationMode === "ON_HANDOVER" ? "On Handover" : "Ready"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{b.quantity}</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground tabular-nums">
                        Stock: {b.stockCount} • Active: {b.activeCount}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-foreground" title={b.generatedByEmail || undefined}>
                          {b.generatedByName || b.generatedByEmail || "Admin"}
                        </div>
                        <div className="text-muted-foreground">
                          {formatDate(b.generatedAt)}
                          {b.exportCount > 0 &&
                            ` • ${b.exportCount}× unduh${b.exportedByName ? ` (${b.exportedByName})` : ""}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingBatchId === b.id}
                          onClick={() => handleExportBatch(b)}
                        >
                          <Download className="size-3.5 mr-1.5" />
                          {downloadingBatchId === b.id ? "Menyiapkan…" : "Cetak Excel QR"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <BatchHistoryCard history={batchHistory} />
        </div>
      ) : (
        <div className="space-y-6">
          {volunteersQueryError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {(volunteersQueryError as Error).message || "Gagal memuat daftar volunteer"}
            </p>
          )}

          {volunteerError && !inviteOpen && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {volunteerError}
            </p>
          )}

          <div className="rounded-lg border overflow-hidden">
            {volunteers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <ShieldCheck className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">Belum ada petugas scanner (volunteer)</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Klik tombol Invite Volunteer untuk memberikan akses scan QR pada event ini.
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setVolunteerError(null);
                    setInviteOpen(true);
                  }}
                >
                  <UserPlus className="size-4 mr-1.5" />
                  Invite Volunteer
                </Button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama Petugas</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status Akses</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Diundang Oleh</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {volunteers.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{v.userName || "Belum login"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.email}</td>
                      <td className="px-4 py-3">
                        <VolunteerStatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-foreground" title={v.invitedByEmail || undefined}>
                          {v.invitedByName || v.invitedByEmail || "Admin"}
                        </div>
                        <div className="text-muted-foreground">{formatDate(v.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={removingVolunteerId === v.id}
                          onClick={() => {
                            setVolunteerError(null);
                            setConfirmRemoveVolunteer(v);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5 mr-1.5" />
                          {removingVolunteerId === v.id ? "Menghapus…" : "Remove"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <VolunteerHistoryCard history={volunteerHistory} />
        </div>
      )}

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Tiket Fisik (QR)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerateBatch} className="space-y-4 pt-2">
            {batchError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {batchError}
              </p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="batch-access-type" className="text-sm font-medium">
                Jenis Tiket / Akses
              </label>
              <Select value={accessType} onValueChange={setAccessType}>
                <SelectTrigger id="batch-access-type" className="w-full">
                  <SelectValue placeholder="Pilih jenis tiket" />
                </SelectTrigger>
                <SelectContent>
                  {stats.length === 0 ? (
                    <SelectItem value="DAY_1">Day 1</SelectItem>
                  ) : (
                    stats.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {missingTicketDates && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  Tanggal berlaku untuk tipe tiket <strong>{selectedStat?.name}</strong> belum diisi oleh Organizer. Minta Organizer melengkapi tanggal tiket di menu Edit Event terlebih dahulu.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="batch-quantity" className="text-sm font-medium">
                Jumlah Tiket (Quantity)
              </label>
              <Input
                id="batch-quantity"
                type="number"
                min={1}
                max={10000}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Contoh: 100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="batch-purpose" className="text-sm font-medium">
                  Tujuan Batch
                </label>
                <Select value={purpose} onValueChange={setPurpose} disabled>
                  <SelectTrigger id="batch-purpose" className="w-full bg-muted/50 cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOCATION">Alokasi Utama</SelectItem>
                    <SelectItem value="RESERVE">Cadangan (Buffer)</SelectItem>
                    <SelectItem value="REPLACEMENT">Pengganti (Replacement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="batch-activation" className="text-sm font-medium">
                  Mode Aktivasi
                </label>
                <Select value={activationMode} onValueChange={setActivationMode} disabled>
                  <SelectTrigger id="batch-activation" className="w-full bg-muted/50 cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ON_HANDOVER">Aktif Saat Penukaran / OTS</SelectItem>
                    <SelectItem value="READY_ON_GENERATE">Langsung Aktif Sejak Dicetak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="batch-name" className="text-sm font-medium">
                Label Batch (Opsional)
              </label>
              <Input
                id="batch-name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Misal: Tiket Tahap 1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={generating || !accessType || missingTicketDates}>
                {generating ? "Membuat…" : "Generate Tiket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Volunteer Scanner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteVolunteer} className="space-y-4 pt-2">
            {volunteerError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {volunteerError}
              </p>
            )}
            <div className="space-y-1.5">
              <label htmlFor="volunteer-email" className="text-sm font-medium">
                Email Volunteer
              </label>
              <Input
                id="volunteer-email"
                type="email"
                value={volunteerEmail}
                onChange={(e) => setVolunteerEmail(e.target.value)}
                placeholder="volunteer@email.com"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Petugas ini hanya dapat membuka halaman Scanner untuk event <strong>{ev.name}</strong>.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? "Mengundang…" : "Invite Volunteer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmRemoveVolunteer}
        onOpenChange={(open) => {
          if (!open) setConfirmRemoveVolunteer(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cabut Akses Volunteer?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2 pt-2">
            <p>
              Akses scanner untuk{" "}
              <strong className="text-foreground">
                {confirmRemoveVolunteer?.userName || confirmRemoveVolunteer?.email}
              </strong>{" "}
              akan dicabut dari event ini.
            </p>
            <p className="text-xs text-muted-foreground">
              Jika volunteer masih memiliki undangan berstatus pending, undangan tersebut juga akan dibatalkan.
            </p>
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!!removingVolunteerId}
              onClick={() => setConfirmRemoveVolunteer(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!!removingVolunteerId}
              onClick={() => {
                if (confirmRemoveVolunteer) {
                  handleRemoveVolunteer(confirmRemoveVolunteer.id);
                }
              }}
            >
              {removingVolunteerId ? "Mencabut…" : "Ya, Cabut Akses"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
