"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  ScanLine,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Ticket as TicketIcon,
  User,
  Calendar,
  MapPin,
  Zap,
  Eye,
} from "lucide-react";

type ScannedTicket = {
  id: string;
  ticketNumber: string;
  barcode: string;
  ticketTypeName: string;
  status: string;
  attendeeName: string | null;
  checkedInAt: string | null;
};

type ScanOrderDetail = {
  orderId: string;
  referenceNumber: string;
  orderBarcode: string;
  orderStatus: string;
  total: number;
  createdAt: string;
  eventId: string;
  eventName: string;
  eventStartsAt: string;
  eventVenueName: string | null;
  eventCity: string | null;
  buyerName: string;
  buyerEmail: string;
  totalTickets: number;
  checkedInCount: number;
  remainingCount: number;
  tickets: ScannedTicket[];
};

type ScanSample = {
  orderId: string;
  referenceNumber: string;
  orderBarcode: string;
  eventId: string;
  eventName: string;
  buyerName: string;
  buyerEmail: string;
  totalTickets: number;
  checkedInCount: number;
  createdAt: string;
};

type EventRow = {
  id: string;
  name: string;
  status: string;
};

type ScanResultState = {
  type: "checked_in" | "already_checked_in" | "preview" | "error";
  message: string;
  checkedInNow?: number;
  order?: ScanOrderDetail;
};

interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ScannerPage() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedCodeRef = useRef<string>("");

  const [code, setCode] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResultState | null>(null);

  const { data: eventsData } = useQuery<{ data: EventRow[] }>({
    queryKey: ["admin-scanner-events"],
    queryFn: () => fetch("/api/events?page=1").then((r) => r.json()),
  });

  const eventFilterParam = selectedEventId === "all" ? "" : `?eventId=${encodeURIComponent(selectedEventId)}`;
  const { data: samplesData, isLoading: samplesLoading } = useQuery<{ samples: ScanSample[] }>({
    queryKey: ["admin-scanner-samples", selectedEventId],
    queryFn: () => fetch(`/api/scanner/samples${eventFilterParam}`).then((r) => r.json()),
  });

  const events = eventsData?.data ?? [];
  const samples = samplesData?.samples ?? [];

  const refreshSamples = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-scanner-samples"] });
  }, [queryClient]);

  const executeScan = useCallback(
    async (rawCode: string, forceAction?: "lookup" | "checkin") => {
      const trimmed = rawCode.trim();
      if (!trimmed) return;
      setBusy(true);
      const action = forceAction ?? (autoCheckin ? "checkin" : "lookup");
      const endpoint = action === "checkin" ? "/api/scanner/checkin" : "/api/scanner/lookup";
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: trimmed,
            eventId: selectedEventId === "all" ? "" : selectedEventId,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          if (action === "checkin") {
            setResult({
              type: "checked_in",
              message: `Check-in berhasil (${data.checkedInNow ?? 1} tiket masuk)`,
              checkedInNow: data.checkedInNow,
              order: data.order,
            });
          } else {
            const ord = data.order as ScanOrderDetail;
            setResult({
              type: ord.remainingCount === 0 ? "already_checked_in" : "preview",
              message:
                ord.remainingCount === 0
                  ? "Semua tiket pada order ini sudah di-check-in"
                  : `Tiket valid (${ord.remainingCount} dari ${ord.totalTickets} tiket belum check-in)`,
              order: ord,
            });
          }
          refreshSamples();
        } else if (data.result === "already_checked_in") {
          setResult({
            type: "already_checked_in",
            message: data.error || "Tiket sudah pernah di-check-in sebelumnya!",
            order: data.order,
          });
          refreshSamples();
        } else {
          setResult({
            type: "error",
            message: data.error || "Tiket tidak valid atau tidak ditemukan",
            order: data.order,
          });
        }
      } catch {
        setResult({
          type: "error",
          message: "Gagal menghubungi server saat memproses scan",
        });
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [autoCheckin, selectedEventId, refreshSamples]
  );

  async function handleCheckinSingleTicket(ticketId: string, orderCode: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/scanner/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: orderCode,
          ticketId,
          eventId: selectedEventId === "all" ? "" : selectedEventId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          type: "checked_in",
          message: "1 tiket berhasil di-check-in",
          checkedInNow: 1,
          order: data.order,
        });
      } else {
        setResult({
          type: data.result === "already_checked_in" ? "already_checked_in" : "error",
          message: data.error || "Gagal check-in tiket",
          order: data.order,
        });
      }
      refreshSamples();
    } finally {
      setBusy(false);
    }
  }

  async function handleResetOrder(orderId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/scanner/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setResult({
          type: "preview",
          message: "Status check-in berhasil di-reset (siap dites ulang)",
          order: data.order,
        });
        refreshSamples();
      }
    } finally {
      setBusy(false);
    }
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  async function startCamera() {
    setCameraError(null);
    lastScannedCodeRef.current = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
      setCameraActive(false);
    }
  }

  useEffect(() => {
    if (!cameraActive) return;
    const DetectorCtor = (
      window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;
    if (!DetectorCtor) {
      setCameraError(
        "Browser ini belum mendukung Web BarcodeDetector. Gunakan Chrome/Edge atau input manual di atas."
      );
      return;
    }
    const detector = new DetectorCtor({ formats: ["qr_code", "code_128"] });
    let cancelled = false;
    const timer = setInterval(async () => {
      if (cancelled || !videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const codes = await detector.detect(videoRef.current);
        const found = codes[0]?.rawValue?.trim();
        if (found && found !== lastScannedCodeRef.current) {
          lastScannedCodeRef.current = found;
          setCode(found);
          await executeScan(found);
          setTimeout(() => {
            lastScannedCodeRef.current = "";
          }, 3000);
        }
      } catch {
        // ignore frame errors
      }
    }, 350);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [cameraActive, executeScan]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ScanLine className="size-6" />
            E-Ticket Scanner &amp; Check-in
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan QR Code E-Ticket, input barcode manual, atau simulasi langsung dari daftar sampel tiket lunas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-60 bg-white">
              <SelectValue placeholder="Semua Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Event (Lintas Acara)</SelectItem>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="inline-flex rounded-lg border bg-white p-1">
            <button
              type="button"
              onClick={() => setAutoCheckin(true)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                autoCheckin
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Zap className="size-3.5" />
              Auto Check-in (Fast Gate)
            </button>
            <button
              type="button"
              onClick={() => setAutoCheckin(false)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !autoCheckin
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Eye className="size-3.5" />
              Preview Dulu
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-lg border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Input Barcode / QR Scanner</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => (cameraActive ? stopCamera() : startCamera())}
              >
                {cameraActive ? (
                  <>
                    <CameraOff className="size-4 mr-1.5" />
                    Matikan Kamera
                  </>
                ) : (
                  <>
                    <Camera className="size-4 mr-1.5" />
                    Buka Kamera QR
                  </>
                )}
              </Button>
            </div>

            {cameraActive && (
              <div className="relative overflow-hidden rounded-lg border bg-black aspect-video max-h-64 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-dashed border-emerald-400/80" />
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                {cameraError}
              </p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeScan(code);
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                autoFocus
                placeholder="Scan QR / masukkan kode barcode atau Order ID (HX-2026-...)..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-sm"
              />
              <Button type="submit" disabled={busy || !code.trim()}>
                {busy
                  ? "Memproses…"
                  : autoCheckin
                    ? "Scan & Check-in"
                    : "Cek Tiket"}
              </Button>
            </form>
          </div>

          {result && (
            <div
              className={`rounded-lg border-2 p-5 space-y-4 ${
                result.type === "checked_in"
                  ? "border-emerald-500 bg-emerald-50/70"
                  : result.type === "already_checked_in"
                    ? "border-red-500 bg-red-50/70"
                    : result.type === "preview"
                      ? "border-blue-500 bg-blue-50/60"
                      : "border-red-400 bg-red-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {result.type === "checked_in" ? (
                    <CheckCircle2 className="size-8 text-emerald-600 shrink-0" />
                  ) : result.type === "already_checked_in" ? (
                    <XCircle className="size-8 text-red-600 shrink-0" />
                  ) : result.type === "preview" ? (
                    <TicketIcon className="size-8 text-blue-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="size-8 text-red-600 shrink-0" />
                  )}
                  <div>
                    <span
                      className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        result.type === "checked_in"
                          ? "bg-emerald-600 text-white"
                          : result.type === "already_checked_in"
                            ? "bg-red-600 text-white"
                            : result.type === "preview"
                              ? "bg-blue-600 text-white"
                              : "bg-red-600 text-white"
                      }`}
                    >
                      {result.type === "checked_in"
                        ? "VALID — BERHASIL MASUK"
                        : result.type === "already_checked_in"
                          ? "DITOLAK — SUDAH CHECK-IN"
                          : result.type === "preview"
                            ? "PREVIEW TIKET"
                            : "TIDAK VALID"}
                    </span>
                    <p className="text-base font-semibold mt-1 text-slate-900">
                      {result.message}
                    </p>
                  </div>
                </div>

                {result.order && (
                  <div className="flex items-center gap-2 shrink-0">
                    {result.order.remainingCount > 0 && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => executeScan(result.order!.orderBarcode || result.order!.referenceNumber, "checkin")}
                      >
                        Check-in Semua ({result.order.remainingCount})
                      </Button>
                    )}
                    {result.order.checkedInCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleResetOrder(result.order!.orderId)}
                        title="Reset status check-in untuk keperluan testing"
                      >
                        <RotateCcw className="size-3.5 mr-1" />
                        Reset Test
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {result.order && (
                <div className="rounded-lg border bg-white p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID / Barcode</p>
                      <p className="font-mono font-semibold">{result.order.referenceNumber}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        QR: {result.order.orderBarcode}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="size-3.5" /> Pembeli
                      </p>
                      <p className="font-medium">{result.order.buyerName}</p>
                      <p className="text-xs text-muted-foreground">{result.order.buyerEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3.5" /> Acara
                      </p>
                      <p className="font-medium">{result.order.eventName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(result.order.eventStartsAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3.5" /> Status Kuota Tiket Order
                      </p>
                      <p className="font-semibold">
                        {result.order.checkedInCount} / {result.order.totalTickets} Tiket Sudah Masuk
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sisa {result.order.remainingCount} tiket belum digunakan
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Rincian Lembar Tiket ({result.order.tickets.length})
                    </p>
                    <div className="divide-y rounded-md border">
                      {result.order.tickets.map((t, idx) => (
                        <div
                          key={t.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                #{idx + 1} — {t.ticketTypeName}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                ({t.ticketNumber})
                              </span>
                            </div>
                            {t.checkedInAt ? (
                              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                                ✓ Masuk pada {formatDateTime(t.checkedInAt)}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Belum check-in • Barcode: <span className="font-mono">{t.barcode}</span>
                              </p>
                            )}
                          </div>

                          <div>
                            {t.checkedInAt ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                                Checked-in
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  handleCheckinSingleTicket(t.id, result.order!.orderBarcode)
                                }
                              >
                                Check-in 1 Tiket Ini
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-lg border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Sampel Order Lunas (Quick Test)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Klik tombol untuk simulasi scan tanpa perlu kamera fisik.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={refreshSamples}>
                Refresh
              </Button>
            </div>

            {samplesLoading ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Memuat sampel tiket…
              </p>
            ) : samples.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Belum ada order berstatus paid di database lokal.
              </p>
            ) : (
              <div className="divide-y rounded-md border max-h-[540px] overflow-y-auto">
                {samples.map((s) => {
                  const allUsed = s.totalTickets > 0 && s.checkedInCount >= s.totalTickets;
                  return (
                    <div key={s.orderId} className="p-3 space-y-2 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{s.buyerName}</p>
                          <p className="text-xs text-muted-foreground">{s.eventName}</p>
                          <p className="font-mono text-xs text-slate-600 mt-0.5">
                            {s.referenceNumber} • QR:{" "}
                            <span className="font-semibold">{s.orderBarcode}</span>
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            allUsed
                              ? "bg-red-100 text-red-700"
                              : s.checkedInCount > 0
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {s.checkedInCount}/{s.totalTickets} Masuk
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            setCode(s.orderBarcode);
                            executeScan(s.orderBarcode, "lookup");
                          }}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setCode(s.orderBarcode);
                            executeScan(s.orderBarcode, "checkin");
                          }}
                        >
                          Simulasi Scan QR
                        </Button>
                        {s.checkedInCount > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => handleResetOrder(s.orderId)}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
