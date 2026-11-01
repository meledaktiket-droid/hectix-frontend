"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Plus, Edit2, Trash2, X, Upload, MoreHorizontal, ExternalLink, Link2, Copy, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@repo/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@repo/ui/tooltip";
import { RichTextEditor } from "./RichTextEditor";
import { CategoryMultiSelect } from "./CategoryMultiSelect";
import { sanitizeCategories } from "../../../../lib/categories";

const INDONESIAN_CITIES = [
  "Jakarta", "Surabaya", "Bandung", "Medan", "Bekasi", "Depok", "Tangerang",
  "Semarang", "Palembang", "Makassar", "Batam", "Pekanbaru", "Bogor",
  "Bandar Lampung", "Padang", "Malang", "Yogyakarta", "Denpasar", "Samarinda",
  "Balikpapan", "Banjarmasin", "Manado", "Pontianak", "Jambi", "Serang",
  "Mataram", "Ambon", "Kupang", "Jayapura", "Sorong",
];

type TicketType = {
  id?: string;
  _key?: string;
  name: string;
  price: number;
  quantity: number;
  benefits: string[];
};

const ticketKey = (t: TicketType) => t.id ?? t._key ?? "";

type Voucher = {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  amount: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
};

type EventData = {
  name: string;
  description: string;
  venueName: string;
  address: string;
  city: string;
  bannerUrl: string;
  startsAt: string;
  endsAt: string;
  visibility: "public" | "private";
  attendeeForm: boolean;
  categories: string[];
};

type Performer = {
  id?: string;
  name: string;
  imageUrl: string | null;
};

type Tab = "info" | "tickets" | "voucher" | "performers";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function parseRupiah(str: string): number {
  return parseInt(str.replace(/\D/g, ""), 10) || 0;
}

function SortableTicketRow({
  ticket,
  onEdit,
  onDelete,
}: {
  ticket: TicketType;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticketKey(ticket),
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 px-4 py-3 bg-background first:rounded-t-lg last:rounded-b-lg ${isDragging ? "relative z-10 shadow-sm" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Reorder ticket type"
        className="cursor-grab touch-none rounded-md p-1 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted active:cursor-grabbing transition-colors"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{ticket.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {ticket.price === 0 ? "Free" : `Rp ${formatRupiah(ticket.price)}`}
          {" · "}
          {ticket.quantity.toLocaleString("id-ID")} tiket
          {(ticket.benefits?.length ?? 0) > 0 && ` · ${ticket.benefits.length} benefit`}
        </p>
      </div>
      <button
        onClick={onEdit}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
      >
        <Edit2 className="size-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function htmlIsEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim() === "" && !html.includes("<img");
}

function BannerUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, folder: "events/banners" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Upload failed. Please try again.");
      }
      const { url, publicUrl } = await res.json();
      await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      return publicUrl as string;
    },
    onSuccess: (publicUrl) => onChange(publicUrl),
  });

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Event Banner</label>
      <div
        onClick={() => !value && !uploadMutation.isPending && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith("image/")) uploadMutation.mutate(file);
        }}
        className={`relative aspect-video rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${value ? "border-transparent cursor-default" :
          dragOver ? "border-primary bg-primary/5 cursor-copy" :
            "border-input hover:border-primary/50 cursor-pointer"
          }`}
      >
        {value ? (
          <>
            <img src={value} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium hover:bg-white transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-white transition-colors"
              >
                Remove
              </button>
            </div>
          </>
        ) : uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <p className="text-xs">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground px-4 text-center">
            <Upload className="size-7" />
            <div>
              <p className="text-sm font-medium">Drop image here</p>
              <p className="text-xs mt-0.5">or click to browse · JPG, PNG, WebP</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.type.startsWith("image/")) uploadMutation.mutate(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function TicketModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (t: TicketType) => void;
  initial?: TicketType | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [priceInput, setPriceInput] = useState(initial ? formatRupiah(initial.price) : "");
  const [benefits, setBenefits] = useState<string[]>(initial?.benefits ?? []);
  const [benefitInput, setBenefitInput] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setPrice(initial?.price ?? 0);
      setQuantity(initial?.quantity ?? 1);
      setPriceInput(initial ? formatRupiah(initial.price) : "");
      setBenefits(initial?.benefits ?? []);
      setBenefitInput("");
    }
  }, [open, initial]);

  function handleSave() {
    if (!name.trim() || quantity < 1) return;
    onSave({ id: initial?.id, name: name.trim(), price, quantity, benefits });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Ticket Type" : "Add Ticket Type"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Early Bird, Presale 1, VIP"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Price (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">Rp</span>
              <input
                value={priceInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  const num = parseInt(raw, 10) || 0;
                  setPrice(num);
                  setPriceInput(raw ? formatRupiah(num) : "");
                }}
                placeholder="0"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p className="text-xs text-muted-foreground">Enter 0 for free tickets</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Benefits <span className="text-muted-foreground">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && benefitInput.trim()) {
                    e.preventDefault();
                    setBenefits((prev) => [...prev, benefitInput.trim()]);
                    setBenefitInput("");
                  }
                }}
                placeholder="Add a benefit and press Enter"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => {
                  if (benefitInput.trim()) {
                    setBenefits((prev) => [...prev, benefitInput.trim()]);
                    setBenefitInput("");
                  }
                }}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {benefits.length > 0 && (
              <ul className="space-y-1 pt-1">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-muted-foreground">{b}</span>
                    <button
                      type="button"
                      onClick={() => setBenefits((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || quantity < 1}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {initial ? "Save changes" : "Add ticket"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VoucherModal({
  open,
  onClose,
  onSave,
  existingCodes,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (v: Voucher) => void;
  existingCodes: string[];
}) {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [amount, setAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (open) {
      setCode("");
      setCodeError("");
      setType("percent");
      setAmount("");
      setUsageLimit("");
      setExpiresAt("");
    }
  }, [open]);

  function handleSave() {
    if (!code.trim() || !amount) return;
    const normalized = code.trim().toUpperCase();
    if (existingCodes.some((c) => c.trim().toUpperCase() === normalized)) {
      setCodeError("Kode voucher sudah ada");
      return;
    }
    const numAmount = parseFloat(amount) || 0;
    onSave({
      code: normalized,
      type,
      amount: numAmount,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
      expiresAt: expiresAt || null,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Voucher</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Voucher Code</label>
            <input
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setCodeError("");
              }}
              placeholder="e.g. EARLYBIRD"
              aria-invalid={!!codeError}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
            />
            {codeError && <p className="text-xs text-destructive">{codeError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setType("percent")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${type === "percent" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  %
                </button>
                <button
                  onClick={() => setType("fixed")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${type === "fixed" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  Rp
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {type === "percent" ? "Discount (%)" : "Amount (Rp)"}
              </label>
              <input
                type="number"
                min={0}
                max={type === "percent" ? 100 : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={type === "percent" ? "10" : "50000"}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Usage limit <span className="text-muted-foreground">(optional)</span></label>
              <input
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Expiry <span className="text-muted-foreground">(optional)</span></label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!code.trim() || !amount}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Create voucher
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PerformerModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, imageUrl: string) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, folder: "events/performers" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Upload failed");
      }
      const { url, publicUrl } = await res.json();
      await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      return publicUrl as string;
    },
    onSuccess: (url) => setImageUrl(url),
  });

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), imageUrl);
    setSaving(false);
    setName("");
    setImageUrl("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Performer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tulus, Rich Brian"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Photo <span className="text-muted-foreground">(optional)</span>
            </label>
            <div
              onClick={() => !imageUrl && !uploadMutation.isPending && inputRef.current?.click()}
              className={`relative flex items-center justify-center rounded-full border-2 border-dashed h-20 w-20 overflow-hidden transition-colors ${imageUrl ? "border-transparent cursor-default" :
                "border-input hover:border-primary/50 cursor-pointer"
                }`}
            >
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImageUrl(""); }}
                      className="rounded-md bg-white/90 p-1 text-destructive hover:bg-white transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </>
              ) : uploadMutation.isPending ? (
                <div className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
              ) : (
                <Upload className="size-5 text-muted-foreground" />
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving || uploadMutation.isPending}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Adding..." : "Add performer"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EventForm({
  title,
  saving,
  initialData,
  initialTickets = [],
  initialPerformers = [],
  initialVouchers = [],
  eventId,
  onSave,
  status,
  paidOrderCount = 0,
  onUnpublish,
  onDuplicate,
  onDelete,
  actionPending = false,
}: {
  title: string;
  saving: boolean;
  initialData?: Partial<EventData> | null;
  initialTickets?: TicketType[];
  initialPerformers?: Performer[];
  initialVouchers?: Voucher[];
  eventId?: string;
  onSave: (data: Record<string, unknown>, tickets: TicketType[], performers: Performer[], vouchers: Voucher[], publish: boolean) => void;
  status?: "draft" | "published";
  paidOrderCount?: number;
  onUnpublish?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  actionPending?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("info");

  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPublished = status === "published";
  const hasSales = paidOrderCount > 0;
  const publicUrl = eventId ? `${process.env.NEXT_PUBLIC_WEB_URL ?? ""}/events/${eventId}` : "";

  function copyPublicLink() {
    if (publicUrl) navigator.clipboard.writeText(publicUrl);
  }

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [startsAt, setStartsAt] = useState(
    initialData?.startsAt ? new Date(initialData.startsAt).toISOString().slice(0, 16) : ""
  );
  const [endsAt, setEndsAt] = useState(
    initialData?.endsAt ? new Date(initialData.endsAt).toISOString().slice(0, 16) : ""
  );
  const [venueName, setVenueName] = useState(initialData?.venueName ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [city, setCity] = useState(initialData?.city ?? "");
  const [categories, setCategories] = useState<string[]>(
    sanitizeCategories(initialData?.categories)
  );
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerUrl ?? "");

  const [tickets, setTickets] = useState<TicketType[]>(initialTickets);
  const [ticketModal, setTicketModal] = useState<{ open: boolean; editing: TicketType | null }>({
    open: false,
    editing: null,
  });

  const ticketSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleTicketDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setTickets((prev) => {
      const from = prev.findIndex((t) => ticketKey(t) === active.id);
      const to = prev.findIndex((t) => ticketKey(t) === over.id);
      if (from === -1 || to === -1) return prev;
      return arrayMove(prev, from, to);
    });
  }

  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [voucherModal, setVoucherModal] = useState(false);

  const [performers, setPerformers] = useState<Performer[]>(initialPerformers);
  const [performerModal, setPerformerModal] = useState(false);

  const canPublish =
    name.trim() !== "" &&
    startsAt !== "" &&
    endsAt !== "" &&
    venueName.trim() !== "" &&
    address.trim() !== "" &&
    city !== "" &&
    categories.length > 0 &&
    tickets.length > 0;

  function buildPayload() {
    return {
      name: name.trim(),
      description: htmlIsEmpty(description) ? null : description,
      venueName: venueName.trim() || null,
      address: address.trim() || null,
      city: city || null,
      bannerUrl: bannerUrl || null,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      categories,
    };
  }

  const savableSnapshot = JSON.stringify({ ...buildPayload(), tickets, performers, vouchers });
  const initialSnapshotRef = useRef<string | null>(null);
  if (initialSnapshotRef.current === null) {
    initialSnapshotRef.current = savableSnapshot;
  }
  const isDirty = savableSnapshot !== initialSnapshotRef.current;
  const saveDisabled = saving || (!!eventId && !isDirty);

  const TABS: { id: Tab; label: string }[] = [
    { id: "info", label: "Info" },
    { id: "tickets", label: `Tickets${tickets.length > 0 ? ` (${tickets.length})` : ""}` },
    { id: "voucher", label: `Voucher${vouchers.length > 0 ? ` (${vouchers.length})` : ""}` },
    { id: "performers", label: `Performers${performers.length > 0 ? ` (${performers.length})` : ""}` },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <Link href="/events" className="rounded-md p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="text-sm font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isPublished ? (
              <button
                onClick={() => onSave(buildPayload(), tickets, performers, vouchers, false)}
                disabled={saveDisabled}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => onSave(buildPayload(), tickets, performers, vouchers, false)}
                  disabled={saveDisabled}
                  className="rounded-lg border px-4 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  onClick={() => onSave(buildPayload(), tickets, performers, vouchers, true)}
                  disabled={saving || !canPublish}
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Publish
                </button>
              </>
            )}

            {eventId && (
              <TooltipProvider>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={actionPending}
                    className="rounded-lg border p-1.5 hover:bg-muted disabled:opacity-50 transition-colors"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {isPublished && (
                      <>
                        {hasSales ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <DropdownMenuItem disabled className="gap-2">
                                  <Copy className="size-4 rotate-180" />
                                  Unpublish
                                </DropdownMenuItem>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Can&apos;t unpublish — this event has sold tickets.</TooltipContent>
                          </Tooltip>
                        ) : (
                          <DropdownMenuItem className="gap-2" onClick={() => setConfirmUnpublish(true)}>
                            <Copy className="size-4 rotate-180" />
                            Unpublish
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem className="gap-2" asChild>
                          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-4" />
                            View public page
                          </a>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="gap-2" onClick={copyPublicLink}>
                          <Link2 className="size-4" />
                          Copy link
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem className="gap-2" onClick={() => onDuplicate?.()}>
                      <Copy className="size-4" />
                      Duplicate
                    </DropdownMenuItem>

                    {hasSales ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <DropdownMenuItem disabled variant="destructive" className="gap-2">
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Can&apos;t delete — this event has sold tickets.</TooltipContent>
                      </Tooltip>
                    ) : (
                      <DropdownMenuItem
                        variant="destructive"
                        className="gap-2"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto py-6">
        {tab === "info" && (
          <div className="flex flex-col lg:flex-row gap-8 items-start max-w-5xl">
            <div className="flex-1 min-w-0 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Event Name <span className="text-destructive">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Loud Fest 2025"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <RichTextEditor value={description} onChange={setDescription} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Start Date & Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    End Date & Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    min={startsAt}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Venue Name <span className="text-destructive">*</span>
                </label>
                <input
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Gelora Bung Karno"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Address <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  City <span className="text-destructive">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select city</option>
                  {INDONESIAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Kategori <span className="text-destructive">*</span>
                </label>
                <CategoryMultiSelect value={categories} onChange={setCategories} />
                {categories.length === 0 && (
                  <p className="text-xs text-muted-foreground">Pilih minimal satu kategori</p>
                )}
              </div>
            </div>

            <div className="w-full lg:w-72 shrink-0">
              <div className="lg:sticky lg:top-4">
                <BannerUpload value={bannerUrl} onChange={setBannerUrl} />
              </div>
            </div>
          </div>
        )}

        {tab === "tickets" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium">Ticket Types</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                At least one ticket type is required to publish.
              </p>
            </div>

            {tickets.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center">
                <p className="text-sm text-muted-foreground">No ticket types yet.</p>
              </div>
            ) : (
              <DndContext
                sensors={ticketSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleTicketDragEnd}
              >
                <SortableContext
                  items={tickets.map(ticketKey)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="rounded-lg border divide-y">
                    {tickets.map((t) => (
                      <SortableTicketRow
                        key={ticketKey(t)}
                        ticket={t}
                        onEdit={() => setTicketModal({ open: true, editing: t })}
                        onDelete={() =>
                          setTickets((prev) => prev.filter((x) => ticketKey(x) !== ticketKey(t)))
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <button
              onClick={() => setTicketModal({ open: true, editing: null })}
              className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full justify-center"
            >
              <Plus className="size-4" />
              Add Ticket Type
            </button>
          </div>
        )}

        {tab === "performers" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium">Performers / Lineup</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add the artists or speakers appearing at your event.
              </p>
            </div>

            {performers.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center">
                <p className="text-sm text-muted-foreground">No performers yet.</p>
              </div>
            ) : (
              <div className="rounded-lg border divide-y">
                {performers.map((p, i) => (
                  <div key={p.id ?? i} className="flex items-center gap-3 px-4 py-3">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-8 w-8 rounded-full object-cover border shrink-0"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground font-medium">
                        {p.name[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <p className="flex-1 text-sm font-medium">{p.name}</p>
                    <button
                      onClick={() => setPerformers((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setPerformerModal(true)}
              className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full justify-center"
            >
              <Plus className="size-4" />
              Add Performer
            </button>
          </div>
        )}

        {tab === "voucher" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Vouchers / Discounts</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Create discount codes for this event.</p>
                </div>
                <button
                  onClick={() => setVoucherModal(true)}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Plus className="size-3" />
                  Add voucher
                </button>
              </div>

              {vouchers.length === 0 ? (
                <p className="text-xs text-muted-foreground rounded-lg border border-dashed p-4 text-center">
                  No vouchers yet.
                </p>
              ) : (
                <div className="rounded-lg border divide-y">
                  {vouchers.map((v, i) => (
                    <div key={v.id ?? i} className="flex items-center gap-3 px-4 py-3">
                      <code className="flex-1 text-sm font-mono font-medium">{v.code}</code>
                      <span className="text-xs text-muted-foreground">
                        {v.type === "percent" ? `${v.amount}%` : `Rp ${formatRupiah(v.amount)}`}
                        {v.usageLimit ? ` · max ${v.usageLimit}x` : ""}
                      </span>
                      <button
                        onClick={() => setVouchers((prev) => prev.filter((_, idx) => idx !== i))}
                        className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <TicketModal
        open={ticketModal.open}
        onClose={() => setTicketModal({ open: false, editing: null })}
        initial={ticketModal.editing}
        onSave={(t) => {
          if (ticketModal.editing) {
            setTickets((prev) =>
              prev.map((existing) =>
                existing === ticketModal.editing ? { ...existing, ...t } : existing
              )
            );
          } else {
            setTickets((prev) => [...prev, { ...t, _key: crypto.randomUUID() }]);
          }
        }}
      />

      <VoucherModal
        open={voucherModal}
        onClose={() => setVoucherModal(false)}
        onSave={(v) => setVouchers((prev) => [...prev, v])}
        existingCodes={vouchers.map((v) => v.code)}
      />


      <PerformerModal
        open={performerModal}
        onClose={() => setPerformerModal(false)}
        onSave={(name, imageUrl) =>
          setPerformers((prev) => [...prev, { name, imageUrl: imageUrl || null }])
        }
      />

      <Dialog open={confirmUnpublish} onOpenChange={(o) => !o && setConfirmUnpublish(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish this event?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            It&apos;ll be hidden from the public until you republish. Your tickets and details stay intact.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmUnpublish(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { setConfirmUnpublish(false); onUnpublish?.(); }}
              disabled={actionPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Unpublish
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this event?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes it from your events. You can&apos;t undo this from here.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { setConfirmDelete(false); onDelete?.(); }}
              disabled={actionPending}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
