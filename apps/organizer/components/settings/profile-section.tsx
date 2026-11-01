"use client";
import { useState } from "react";
import { authClient } from "../../lib/auth-client";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

async function uploadImage(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, folder: "avatars" }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload failed");
  const { url, publicUrl } = await res.json();
  await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return publicUrl as string;
}

export function ProfileSection() {
  const { data: session } = authClient.useSession();
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const user = session?.user;
  const displayName = name || user?.name || "";
  const displayImage = image ?? user?.image ?? undefined;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setImage(await uploadImage(file)); } catch (err) { setMsg((err as Error).message); }
  }

  async function save() {
    setSaving(true); setMsg("");
    const { error } = await authClient.updateUser({ name: displayName, image: displayImage });
    setSaving(false);
    setMsg(error ? error.message ?? "Failed" : "Saved");
  }

  return (
    <section className="space-y-4 rounded-lg border p-5">
      <h2 className="font-semibold">Profile</h2>
      <div className="flex items-center gap-4">
        {displayImage
          ? <img src={displayImage} alt="" className="h-16 w-16 rounded-full object-cover" />
          : <div className="h-16 w-16 rounded-full bg-muted" />}
        <label className="cursor-pointer text-sm text-primary hover:underline">
          Change photo
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickImage} />
        </label>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Name</label>
        <Input value={displayName} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <Input value={user?.email ?? ""} disabled />
        <p className="text-xs text-muted-foreground">Email is managed through your Google account.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </section>
  );
}
