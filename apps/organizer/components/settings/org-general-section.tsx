"use client";

import { useState } from "react";
import { authClient } from "../../lib/auth-client";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

type Meta = Record<string, unknown>;

type Org = {
  id: string;
  name?: string;
  slug?: string;
  logo?: string | null;
  metadata?: unknown;
};

function parseMeta(m: unknown): Meta {
  if (!m) return {};
  if (typeof m === "string") {
    try {
      return JSON.parse(m) as Meta;
    } catch {
      return {};
    }
  }
  if (typeof m === "object") return m as Meta;
  return {};
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

async function uploadLogo(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      folder: "org-logos",
    }),
  });
  if (!res.ok) throw new Error("Upload failed");
  const { url, publicUrl } = (await res.json()) as { url: string; publicUrl: string };
  await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return publicUrl;
}

export function OrgGeneralSection({ org }: { org: Org }) {
  const meta = parseMeta(org?.metadata);
  const isEntity = meta.type === "entity";

  const [name, setName] = useState(org?.name ?? str(meta.name));
  const [phone, setPhone] = useState(str(meta.phone));
  const [website, setWebsite] = useState(str(meta.website));
  const [businessType, setBusinessType] = useState(str(meta.businessType));
  const [logo, setLogo] = useState<string | undefined>(org?.logo ?? undefined);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    const newMeta: Meta = {
      ...meta,
      type: meta.type,
      name,
      phone,
      ...(isEntity ? { website, businessType } : {}),
    };
    const { error } = await authClient.organization.update({
      organizationId: org.id,
      data: { name, logo, metadata: newMeta },
    });
    setSaving(false);
    setMsg(error ? (error.message ?? "Failed") : "Saved");
  }

  return (
    <section className="space-y-4 rounded-lg border p-5">
      <h2 className="font-semibold">Organization details</h2>
      <div className="flex items-center gap-4">
        {logo ? (
          <img src={logo} alt="" className="h-16 w-16 rounded object-cover" />
        ) : (
          <div className="h-16 w-16 rounded bg-muted" />
        )}
        <label className="cursor-pointer text-sm text-primary hover:underline">
          Change logo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setLogo(await uploadLogo(f));
            }}
          />
        </label>
      </div>
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Phone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      {isEntity && (
        <Field label="Website">
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
        </Field>
      )}
      {isEntity && (
        <Field label="Business type">
          <Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
        </Field>
      )}
      <Field label="Slug">
        <Input value={org?.slug ?? ""} disabled />
      </Field>
      <Field label="Type">
        <Input value={str(meta.type)} disabled />
      </Field>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
