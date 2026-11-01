"use client";

import { useEffect, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";

const LABEL: Record<string, string> = {
  pending: "Pending",
  review: "Under review",
  active: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

type Status = {
  status: string;
  statusNote: string | null;
  allowResubmit: boolean;
};

export function VerificationSection() {
  const [s, setS] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/org/status")
      .then((r) => r.json())
      .then(setS)
      .catch(() => {});
  }, []);

  if (!s) return null;

  return (
    <section className="space-y-4 rounded-lg border p-5">
      <h2 className="font-semibold">Verification</h2>
      <div className="flex items-center justify-between text-sm">
        <span>Status</span>
        <Badge>{LABEL[s.status] ?? s.status}</Badge>
      </div>
      {s.statusNote && (
        <p className="rounded bg-muted p-3 text-sm text-muted-foreground">{s.statusNote}</p>
      )}
      {s.allowResubmit && (
        <Button onClick={() => { window.location.href = "/create-org"; }}>
          Resubmit verification
        </Button>
      )}
    </section>
  );
}
