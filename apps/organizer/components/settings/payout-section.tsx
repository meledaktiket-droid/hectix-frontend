"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { authClient } from "../../lib/auth-client";

type PayoutForm = { bankName: string; accountNumber: string; accountHolderName: string };

export function PayoutSection() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PayoutForm>({ bankName: "", accountNumber: "", accountHolderName: "" });
  const [msg, setMsg] = useState("");

  const { data } = useQuery<PayoutForm>({
    queryKey: ["org-payout", activeOrg?.id],
    queryFn: () => fetch("/api/org/payout").then((r) => r.json()),
    enabled: !!activeOrg?.id,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation<boolean, Error, PayoutForm>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/org/payout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    },
    onSuccess: (ok) => {
      setMsg(ok ? "Saved" : "Failed");
      if (ok) queryClient.invalidateQueries({ queryKey: ["org-payout", activeOrg?.id] });
    },
    onError: () => setMsg("Failed"),
  });

  function save() {
    setMsg("");
    saveMutation.mutate(form);
  }

  const set = (k: keyof PayoutForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <section className="space-y-4 rounded-lg border p-5">
      <h2 className="font-semibold">Payout account</h2>
      <p className="text-sm text-muted-foreground">Where your event earnings are sent.</p>
      <div className="space-y-1">
        <label className="text-sm font-medium">Bank name</label>
        <Input value={form.bankName} onChange={set("bankName")} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Account number</label>
        <Input value={form.accountNumber} onChange={set("accountNumber")} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Account holder name</label>
        <Input value={form.accountHolderName} onChange={set("accountHolderName")} />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save"}</Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </section>
  );
}
