"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

type Settings = {
  whatsapp_number: string;
  contact_email: string;
  instagram_url: string;
  tiktok_url: string;
  service_fee: string;
  platform_fee: string;
  min_payout: string;
  tax_percent: string;
  midtrans_va_fee: string;
  midtrans_qris_percent: string;
};

const sections = [
  { id: "kontak", label: "Kontak" },
  { id: "biaya", label: "Biaya" },
  { id: "midtrans", label: "Midtrans" },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [active, setActive] = useState<SectionId>("kontak");
  const [form, setForm] = useState<Settings>({
    whatsapp_number: "",
    contact_email: "",
    instagram_url: "",
    tiktok_url: "",
    service_fee: "",
    platform_fee: "",
    min_payout: "",
    tax_percent: "",
    midtrans_va_fee: "",
    midtrans_qris_percent: "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const settingsQuery = useQuery<Settings>({
    queryKey: ["admin-settings"],
    queryFn: ({ signal }) =>
      fetch("/api/settings", { signal }).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
  });

  useEffect(() => {
    if (settingsQuery.data) setForm(settingsQuery.data);
  }, [settingsQuery.data]);

  const loading = settingsQuery.isLoading;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Gagal menyimpan");
      }
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const saving = saveMutation.isPending;

  function save() {
    setError("");
    setSaved(false);
    saveMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pengaturan global aplikasi.</p>
      </div>

      <div className="flex flex-col gap-8 sm:flex-row">
        <nav className="shrink-0 sm:w-44">
          <ul className="flex gap-1 sm:flex-col">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active === s.id
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-lg flex-1 space-y-5">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
                <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
              </div>
            ))
          ) : (
            <>
              {active === "kontak" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nomor WhatsApp</label>
                    <Input
                      value={form.whatsapp_number}
                      onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                      placeholder="6281234567890"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format internasional tanpa +, contoh: 6281234567890.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email Resmi</label>
                    <Input
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      placeholder="meledaktiket@gmail.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email kontak resmi yang ditampilkan di footer situs.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Instagram (URL)</label>
                    <Input
                      value={form.instagram_url}
                      onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/meledaktiket"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">TikTok (URL)</label>
                    <Input
                      value={form.tiktok_url}
                      onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
                      placeholder="https://tiktok.com/@meledaktiket"
                    />
                  </div>
                </>
              )}

              {active === "biaya" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Biaya Layanan (Rp)</label>
                    <Input
                      type="number"
                      value={form.service_fee}
                      onChange={(e) => setForm({ ...form, service_fee: e.target.value })}
                      placeholder="7120"
                      min={0}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Biaya Platform (Rp)</label>
                    <Input
                      type="number"
                      value={form.platform_fee}
                      onChange={(e) => setForm({ ...form, platform_fee: e.target.value })}
                      placeholder="0"
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Biaya tetap yang dipotong dari penyelenggara setiap kali mereka mencairkan dana. Isi 0 untuk tanpa biaya.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Minimal Pencairan (Rp)</label>
                    <Input
                      type="number"
                      value={form.min_payout}
                      onChange={(e) => setForm({ ...form, min_payout: e.target.value })}
                      placeholder="50000"
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Jumlah minimum yang dapat dicairkan penyelenggara dalam satu permintaan. Isi 0 untuk tanpa batas minimum.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Pajak (%)</label>
                    <Input
                      type="number"
                      value={form.tax_percent}
                      onChange={(e) => setForm({ ...form, tax_percent: e.target.value })}
                      placeholder="10"
                      min={0}
                    />
                  </div>
                </>
              )}

              {active === "midtrans" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Biaya Midtrans VA (Rp)</label>
                    <Input
                      type="number"
                      value={form.midtrans_va_fee}
                      onChange={(e) => setForm({ ...form, midtrans_va_fee: e.target.value })}
                      placeholder="4000"
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Estimasi biaya tetap Midtrans per transaksi Virtual Account. Sesuaikan dengan kontrak Midtrans Anda.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Biaya Midtrans QRIS (%)</label>
                    <Input
                      type="number"
                      value={form.midtrans_qris_percent}
                      onChange={(e) => setForm({ ...form, midtrans_qris_percent: e.target.value })}
                      placeholder="0.7"
                      min={0}
                      step="0.1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Estimasi MDR Midtrans untuk QRIS (persen dari total). Sesuaikan dengan kontrak Midtrans Anda.
                    </p>
                  </div>
                </>
              )}

              {settingsQuery.isError && (
                <p className="text-sm text-destructive">Gagal memuat pengaturan</p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {saved && <p className="text-sm text-emerald-600">Tersimpan.</p>}

              <Button onClick={save} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
