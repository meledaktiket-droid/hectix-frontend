"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { Building2, User, ArrowRight, ArrowLeft, Check, Plus, X } from "lucide-react";

type OrgType = "personal" | "entity";

type PersonalDetails = {
  name: string;
  phone: string;
};

type EntityDetails = {
  name: string;
  businessType: string;
  phone: string;
  website: string;
};

type Details = PersonalDetails | EntityDetails;

const BUSINESS_TYPES = [
  "Startup",
  "Agency",
  "Enterprise",
  "Non-profit",
  "Government",
  "Freelance",
  "Other",
];

const STEPS = ["Type", "Details", "Invite", "Verify"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`flex size-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i < current
                  ? "bg-primary text-primary-foreground"
                  : i === current
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < current ? <Check className="size-3" /> : i + 1}
            </div>
            <span
              className={`text-sm ${
                i === current ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-8 ${i < current ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1({ onNext }: { onNext: (type: OrgType) => void }) {
  const [selected, setSelected] = useState<OrgType | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">What kind of organization?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This helps us set up your workspace correctly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => setSelected("personal")}
          className={`flex flex-col gap-3 rounded-xl border-2 p-5 text-left transition-colors ${
            selected === "personal"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/40"
          }`}
        >
          <div className={`flex size-10 items-center justify-center rounded-lg ${selected === "personal" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <User className="size-5" />
          </div>
          <div>
            <p className="font-medium">Personal</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Just you, or a small team working under your own name.
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelected("entity")}
          className={`flex flex-col gap-3 rounded-xl border-2 p-5 text-left transition-colors ${
            selected === "entity"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/40"
          }`}
        >
          <div className={`flex size-10 items-center justify-center rounded-lg ${selected === "entity" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="font-medium">Business / Entity</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              A company, agency, non-profit, or registered organization.
            </p>
          </div>
        </button>
      </div>

      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function Step2({
  type,
  onNext,
  onBack,
}: {
  type: OrgType;
  onNext: (details: Details) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [website, setWebsite] = useState("");

  const isValid = name.trim().length > 0;

  function handleSubmit() {
    if (!isValid) return;
    if (type === "personal") {
      onNext({ name: name.trim(), phone });
    } else {
      onNext({ name: name.trim(), businessType, phone, website });
    }
  }

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {type === "personal" ? "Tell us about yourself" : "Tell us about your organization"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {type === "personal"
            ? "This will be the name of your workspace."
            : "Fill in your organization details."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="org-name" className="text-sm font-medium">
            {type === "personal" ? "Your name" : "Organization name"} <span className="text-destructive">*</span>
          </label>
          <input
            id="org-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "personal" ? "John Doe" : "Acme Corp"}
            maxLength={64}
            className={inputClass}
          />
        </div>

        {type === "entity" && (
          <div className="space-y-1.5">
            <label htmlFor="business-type" className="text-sm font-medium">Business type</label>
            <select
              id="business-type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a type</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">Phone number</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+62 812 0000 0000"
            className={inputClass}
          />
        </div>

        {type === "entity" && (
          <div className="space-y-1.5">
            <label htmlFor="website" className="text-sm font-medium">Website</label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://acme.com"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Continue <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Step3({
  orgId,
  onNext,
  onBack,
}: {
  orgId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  function addEmail() {
    const val = input.trim().toLowerCase();
    if (!val || emails.includes(val)) return;
    setEmails((prev) => [...prev, val]);
    setInput("");
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email));
  }

  async function handleNext() {
    setSending(true);
    await Promise.all(
      emails.map((email) =>
        authClient.organization.inviteMember({
          organizationId: orgId,
          email,
          role: "member",
          resend: false,
        })
      )
    );
    setSending(false);
    onNext();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invite your team</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Add teammates to your organization. You can always do this later.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="email"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEmail()}
            placeholder="colleague@example.com"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={addEmail}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <Plus className="size-4" /> Add
          </button>
        </div>

        {emails.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {emails.map((email) => (
              <span
                key={email}
                className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
              >
                {email}
                <button onClick={() => removeEmail(email)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={handleNext}
          disabled={sending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {sending ? "Sending invites..." : "Continue"}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Step4({
  type,
  onSkip,
  onBack,
}: {
  type: OrgType;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [ktpNumber, setKtpNumber] = useState("");
  const [nib, setNib] = useState("");
  const [picName, setPicName] = useState("");
  const [picKtpNumber, setPicKtpNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const submitMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/org/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to verify");
    },
    onSuccess: () => onSkip(),
  });

  function handleSubmit() {
    const payload = type === "personal"
      ? { ktpNumber, bankName, accountNumber, accountHolderName }
      : { nib, picName, picKtpNumber, bankName, accountNumber, accountHolderName };
    submitMutation.mutate(payload);
  }

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  const hasMinimum = type === "personal"
    ? ktpNumber.trim().length > 0
    : nib.trim().length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verify your identity</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This helps us verify your organization. You can skip and complete this later from settings.
        </p>
      </div>

      <div className="space-y-4">
        {type === "personal" ? (
          <div className="space-y-1.5">
            <label htmlFor="ktp" className="text-sm font-medium">KTP Number <span className="text-destructive">*</span></label>
            <input
              id="ktp"
              value={ktpNumber}
              onChange={(e) => setKtpNumber(e.target.value)}
              placeholder="3273xxxxxxxxxxxxxxx"
              maxLength={16}
              className={inputClass}
            />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label htmlFor="nib" className="text-sm font-medium">NIB (Nomor Induk Berusaha) <span className="text-destructive">*</span></label>
              <input
                id="nib"
                value={nib}
                onChange={(e) => setNib(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxx"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pic-name" className="text-sm font-medium">PIC Name</label>
              <input
                id="pic-name"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="John Doe"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pic-ktp" className="text-sm font-medium">PIC KTP Number</label>
              <input
                id="pic-ktp"
                value={picKtpNumber}
                onChange={(e) => setPicKtpNumber(e.target.value)}
                placeholder="3273xxxxxxxxxxxxxxx"
                maxLength={16}
                className={inputClass}
              />
            </div>
          </>
        )}

        <div className="pt-2">
          <p className="text-sm font-medium mb-3">Bank account</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="bank-name" className="text-sm font-medium">Bank name</label>
              <input
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="BCA, Mandiri, BNI..."
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="account-number" className="text-sm font-medium">Account number</label>
              <input
                id="account-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="account-holder" className="text-sm font-medium">Account holder name</label>
              <input
                id="account-holder"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="John Doe"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={onSkip}
          className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={handleSubmit}
          disabled={!hasMinimum || submitMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {submitMutation.isPending ? "Submitting..." : "Submit for review"}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default function CreateOrgPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleDetailsNext(d: Details) {
    setCreateError(null);

    const slug = d.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const { data, error } = await authClient.organization.create({
      name: d.name,
      slug,
      metadata: { type: orgType, ...d },
    });

    if (error || !data) {
      setCreateError(error?.message ?? "Failed to create organization.");
      return;
    }

    setCreatedOrgId(data.id);
    await authClient.organization.setActive({ organizationId: data.id });

    try {
      await fetch("/api/org/log-creation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: data.id }),
      });
    } catch {
    }

    setStep(2);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            H
          </div>
          <StepIndicator current={step} />
        </div>

        {createError && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {createError}
          </div>
        )}

        {step === 0 && (
          <Step1
            onNext={(type) => {
              setOrgType(type);
              setStep(1);
            }}
          />
        )}

        {step === 1 && orgType && (
          <Step2
            type={orgType}
            onNext={handleDetailsNext}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && createdOrgId && (
          <Step3
            orgId={createdOrgId}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && orgType && (
          <Step4
            type={orgType}
            onSkip={() => router.push("/dashboard")}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </main>
  );
}
