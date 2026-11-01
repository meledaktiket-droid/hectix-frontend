"use client";

import { useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import type { ProfileData } from "./profile-client";

async function uploadImage(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload failed");
  const { url, publicUrl } = await res.json();
  await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return publicUrl as string;
}

export function EditProfileDialog({ data, onClose }: { data: ProfileData; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: data.name ?? "",
    location: data.location ?? "",
    gender: data.gender ?? "",
    tiktok: data.tiktok ?? "",
    instagram: data.instagram ?? "",
    image: data.image ?? "",
    coverImage: data.coverImage ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["session"] });
      onClose();
    },
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-[640px] max-w-[92vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
          <DialogPrimitive.Title className="text-3xl font-bold text-[#0C2D57]">Ubah Profil</DialogPrimitive.Title>

          <div
            className="relative mt-5 h-40 rounded-2xl bg-gradient-to-r from-[#7cc6f5] to-[#bcd9e8] bg-cover bg-center"
            style={form.coverImage ? { backgroundImage: `url(${form.coverImage})` } : undefined}
          >
            <AvatarUpload value={form.image} onChange={(v) => set("image", v)} />
            <CoverUploadButton onChange={(v) => set("coverImage", v)} />
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Email">
              <input value={data.email} disabled className="w-full rounded-full bg-neutral-200 px-4 py-2.5 text-neutral-500" />
            </Field>
            <Field label="Nama Pengguna">
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Masukkan Nama" className={inputCls} />
            </Field>
            <Field label="Lokasi">
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Masukkan Lokasi" className={inputCls} />
            </Field>
            <Field label="Gender">
              <div className="flex gap-3">
                <GenderPill label="Laki - laki" value="male" current={form.gender} onSelect={(v) => set("gender", v)} />
                <GenderPill label="Perempuan" value="female" current={form.gender} onSelect={(v) => set("gender", v)} />
              </div>
            </Field>
            <p className="font-bold text-[#0C2D57]">Sosial Media</p>
            <LabeledRow label="Tiktok"><input value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="Masukkan Alamat Akun" className={inputCls} /></LabeledRow>
            <LabeledRow label="Instagram"><input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="Masukkan Alamat Akun" className={inputCls} /></LabeledRow>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <p className="text-sm text-neutral-500">• Anda dapat mengubah setelan preferensi profil anda melalui pengaturan privasi.</p>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="shrink-0 rounded-full bg-[#9E3C77] px-6 py-3 font-semibold text-white disabled:opacity-60"
            >
              {save.isPending ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const inputCls = "w-full rounded-full border border-border px-4 py-2.5 text-sm outline-none focus:border-[#2a8af6]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><p className="mb-1.5 font-bold text-[#0C2D57]">{label}</p>{children}</div>;
}
function LabeledRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex items-center gap-4"><span className="w-24 font-semibold text-[#0C2D57]">{label}</span><div className="flex-1">{children}</div></div>;
}
function GenderPill({ label, value, current, onSelect }: { label: string; value: string; current: string; onSelect: (v: string) => void }) {
  const active = current === value;
  return (
    <button onClick={() => onSelect(value)} className={`flex flex-1 items-center gap-2 rounded-full border px-4 py-2.5 ${active ? "border-[#2a8af6]" : "border-border"}`}>
      <span className={`h-4 w-4 rounded-full border ${active ? "border-[#2a8af6] bg-[#2a8af6]" : "border-neutral-400"}`} />
      {label}
    </button>
  );
}

function AvatarUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="absolute -bottom-2 left-4 flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-neutral-200">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-full w-full object-cover" />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
        <Upload className="h-5 w-5 text-white" />
      </span>
      <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        setBusy(true);
        try {
          onChange(await uploadImage(file));
        } catch (err) {
          alert(err instanceof Error ? err.message : "Gagal mengunggah gambar");
        } finally {
          setBusy(false);
        }
      }} />
    </label>
  );
}

function CoverUploadButton({ onChange }: { onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="absolute bottom-3 right-3 flex cursor-pointer items-center justify-center rounded-full bg-white/70 p-2.5">
      <Upload className="h-4 w-4 text-[#0C2D57]" />
      <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        setBusy(true);
        try {
          onChange(await uploadImage(file));
        } catch (err) {
          alert(err instanceof Error ? err.message : "Gagal mengunggah gambar");
        } finally {
          setBusy(false);
        }
      }} />
    </label>
  );
}
