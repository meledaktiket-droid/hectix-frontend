"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { Upload, X, FileText, ImageIcon, ShieldCheck, Landmark, User, Building2, Lock, Clock, CheckCircle2, Circle } from "lucide-react";

const animationStyles = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1);    }
  }
  .anim-fade-slide-up { animation: fadeSlideUp 220ms cubic-bezier(0.25, 1, 0.5, 1) both; }
  .anim-scale-in      { animation: scaleIn     300ms cubic-bezier(0.25, 1, 0.5, 1) both; }
  .anim-delay-100 { animation-delay: 100ms; }
  .anim-delay-200 { animation-delay: 200ms; }
  @media (prefers-reduced-motion: reduce) {
    .anim-fade-slide-up, .anim-scale-in { animation: none; }
  }
`;

type UploadedFile = { key: string; url: string; name: string };

function FileUpload({
  label,
  hint,
  accept,
  required,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  required?: boolean;
  value: UploadedFile | null;
  onChange: (f: UploadedFile | null) => void;
}) {
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Upload failed. Please try again.");
      }
      const { url, key } = await res.json();
      await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      return { key, url: url.split("?")[0], name: file.name };
    },
    onSuccess: (result) => onChange(result),
  });

  const uploading = uploadMutation.isPending;
  const error = uploadMutation.error instanceof Error ? uploadMutation.error.message : null;

  function handleFile(file: File) {
    uploadMutation.mutate(file);
  }

  const isImage = value && (value.name.match(/\.(jpg|jpeg|png|webp)$/i));

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      <p className="text-xs text-muted-foreground">{hint}</p>

      {value ? (
        <div key={value.key} className="anim-fade-slide-up flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          {isImage ? <ImageIcon className="size-4 text-muted-foreground shrink-0" /> : <FileText className="size-4 text-muted-foreground shrink-0" />}
          <span className="flex-1 truncate text-sm">{value.name}</span>
          <button type="button" onClick={() => onChange(null)} aria-label="Remove file" className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/20 ${uploading ? "pointer-events-none" : ""}`}>
          <Upload className={`size-6 text-muted-foreground ${uploading ? "animate-pulse" : ""}`} />
          <div>
            <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, PDF — max 10MB</p>
          </div>
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </label>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
          <Icon className="size-4 text-foreground" />
        </div>
        <div className="pt-1">
          <h2 className="text-base font-semibold leading-none">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-1.5">{description}</p>}
        </div>
      </div>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const meta = (() => {
    try { return activeOrg?.metadata ? JSON.parse(activeOrg.metadata as string) : null; }
    catch { return null; }
  })();
  const type: "personal" | "entity" = meta?.type === "entity" ? "entity" : "personal";

  const { data: orgStatus } = useQuery({
    queryKey: ["org-status", activeOrg?.id],
    queryFn: () => fetch("/api/org/status").then((r) => r.json()),
    enabled: !!activeOrg?.id,
    staleTime: 0,
  });
  const isResubmit = orgStatus?.status === "rejected" && orgStatus?.allowResubmit;

  const submitMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/org/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Something went wrong. Please try again or contact us on WhatsApp.");
      }
    },
    onSuccess: () => {
      window.dispatchEvent(new Event("org-verified"));
    },
  });

  const submitting = submitMutation.isPending;
  const submitError = submitMutation.error instanceof Error ? submitMutation.error.message : null;

  const [ktpNumber, setKtpNumber] = useState("");
  const [ktpFile, setKtpFile] = useState<UploadedFile | null>(null);

  const [nib, setNib] = useState("");
  const [nibFile, setNibFile] = useState<UploadedFile | null>(null);
  const [picName, setPicName] = useState("");
  const [picKtpNumber, setPicKtpNumber] = useState("");
  const [picKtpFile, setPicKtpFile] = useState<UploadedFile | null>(null);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const canSubmit = type === "personal"
    ? ktpNumber.trim() && ktpFile && bankName.trim() && accountNumber.trim() && accountHolderName.trim()
    : nib.trim() && nibFile && bankName.trim() && accountNumber.trim() && accountHolderName.trim();

  function handleSubmit() {
    const payload = type === "personal"
      ? { ktpNumber, ktpFileKey: ktpFile?.key, bankName, accountNumber, accountHolderName }
      : { nib, nibFileKey: nibFile?.key, picName, picKtpNumber, picKtpFileKey: picKtpFile?.key, bankName, accountNumber, accountHolderName };
    submitMutation.mutate(payload);
  }

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  if (submitMutation.isSuccess) {
    return (
      <>
      <style>{animationStyles}</style>
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <div className="anim-scale-in mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-50">
          <ShieldCheck className="size-8 text-emerald-600" />
        </div>
        <h1 className="anim-fade-slide-up anim-delay-100 text-xl font-semibold tracking-tight">Submitted for review</h1>
        <p className="anim-fade-slide-up anim-delay-100 mt-2 text-sm text-muted-foreground">
          We'll review <span className="font-medium">{activeOrg?.name}</span> and activate your account within 1–2 business days. If we need anything else, we'll reach out on WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="anim-fade-slide-up anim-delay-200 mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to dashboard
        </button>
      </div>
      </>
    );
  }

  return (
    <div className="max-w-xl">
      <style>{animationStyles}</style>
      <div className="pb-8 border-b">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">One-time setup</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Verify your organization</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete this once to activate <span className="font-medium text-foreground">{activeOrg?.name}</span> and start selling tickets.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Lock className="size-3 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your documents are encrypted and only used to verify your identity.
          </p>
        </div>
        {isResubmit && orgStatus?.statusNote && (
          <div className="flex items-start gap-2 mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <span className="text-xs font-medium text-red-700 shrink-0">Previous submission rejected:</span>
            <span className="text-xs text-red-700">{orgStatus.statusNote}</span>
          </div>
        )}
      </div>

      <div className="mt-6 mb-10 rounded-lg bg-muted/40 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before you start</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>~5 minutes</span>
          </div>
        </div>

        <ul className="space-y-2">
          {type === "personal" ? (
            <>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-foreground mt-0.5 shrink-0" />
                <span className="text-sm">KTP number and a clear photo of the front</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-foreground mt-0.5 shrink-0" />
                <span className="text-sm">Bank account number and account holder name</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-foreground mt-0.5 shrink-0" />
                <span className="text-sm">NIB number and the NIB certificate (PDF or photo)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-foreground mt-0.5 shrink-0" />
                <span className="text-sm">Company bank account number and account holder name</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Circle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">PIC name, KTP number, and KTP photo <span className="text-xs">(optional)</span></span>
              </li>
            </>
          )}
        </ul>

        <div className="pt-1 border-t">
          <p className="text-xs text-muted-foreground">After you submit, we'll review your details and activate your account within 1–2 business days.</p>
        </div>
      </div>

      <div className="space-y-10">
        {type === "personal" ? (
          <Section icon={User} title="Identity">
            <div className="space-y-1.5">
              <label htmlFor="ktp" className="text-sm font-medium">KTP number <span className="text-destructive">*</span></label>
              <input id="ktp" autoFocus value={ktpNumber} onChange={(e) => setKtpNumber(e.target.value)} placeholder="3273xxxxxxxxxxxxxxx" maxLength={16} className={inputClass} />
            </div>
            <FileUpload
              label="KTP photo"
              hint="Upload a clear photo of your KTP (front side)"
              accept="image/jpeg,image/png,image/webp"
              required
              value={ktpFile}
              onChange={setKtpFile}
            />
          </Section>
        ) : (
          <Section icon={Building2} title="Business Identity">
            <div className="space-y-1.5">
              <label htmlFor="nib" className="text-sm font-medium">NIB (Nomor Induk Berusaha) <span className="text-destructive">*</span></label>
              <input id="nib" autoFocus value={nib} onChange={(e) => setNib(e.target.value)} placeholder="xxxxxxxxxxxxxxxxxx" className={inputClass} />
            </div>
            <FileUpload
              label="NIB document"
              hint="Upload your NIB certificate (PDF or image)"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
              value={nibFile}
              onChange={setNibFile}
            />
            <div className="space-y-1.5">
              <label htmlFor="pic-name" className="text-sm font-medium">PIC name <span className="text-xs font-normal text-muted-foreground">(optional)</span></label>
              <p className="text-xs text-muted-foreground">Person in Charge — the individual responsible for this account</p>
              <input id="pic-name" value={picName} onChange={(e) => setPicName(e.target.value)} placeholder="Full name" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pic-ktp" className="text-sm font-medium">PIC KTP number <span className="text-xs font-normal text-muted-foreground">(optional)</span></label>
              <input id="pic-ktp" value={picKtpNumber} onChange={(e) => setPicKtpNumber(e.target.value)} placeholder="3273xxxxxxxxxxxxxxx" maxLength={16} className={inputClass} />
            </div>
            <FileUpload
              label="PIC KTP photo"
              hint="Upload a clear photo of the PIC's KTP (front side)"
              accept="image/jpeg,image/png,image/webp"
              value={picKtpFile}
              onChange={setPicKtpFile}
            />
          </Section>
        )}

        <Section icon={Landmark} title="Bank Account" description="Used for event payouts. Must match your organization's registered name.">
          <div className="space-y-1.5">
            <label htmlFor="bank-name" className="text-sm font-medium">Bank name <span className="text-destructive">*</span></label>
            <input id="bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA, Mandiri, BNI..." className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="account-number" className="text-sm font-medium">Account number <span className="text-destructive">*</span></label>
            <input id="account-number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="1234567890" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="account-holder" className="text-sm font-medium">Account holder name <span className="text-destructive">*</span></label>
            <input id="account-holder" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} placeholder="As printed on your bank card" className={inputClass} />
          </div>
        </Section>
      </div>

      <div className="mt-10 pb-12 space-y-3 border-t pt-8">
        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit for review"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Later
          </button>
        </div>
        <p className="text-xs text-muted-foreground">We'll review your submission within 1–2 business days.</p>
      </div>
    </div>
  );
}
