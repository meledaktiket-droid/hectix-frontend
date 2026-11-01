"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EventForm } from "../../_components/EventForm";

type TicketType = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  benefits: string[];
};

async function syncTickets(eventId: string, initial: TicketType[], current: TicketType[]) {
  const initialIds = new Set(initial.map((t) => t.id).filter(Boolean));
  const currentIds = new Set(current.map((t) => t.id).filter(Boolean));

  const ops: Promise<unknown>[] = [];

  for (const t of initial) {
    if (t.id && !currentIds.has(t.id)) {
      ops.push(
        fetch(`/api/events/${eventId}/tickets/${t.id}`, { method: "DELETE" }).then(async (r) => {
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            throw new Error(j.error ?? "Failed to delete ticket");
          }
        })
      );
    }
  }

  for (const [i, t] of current.entries()) {
    if (!t.id) {
      ops.push(
        fetch(`/api/events/${eventId}/tickets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: t.name, price: t.price, quantity: t.quantity, benefits: t.benefits, displayOrder: i }),
        }).then(async (r) => {
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            throw new Error(j.error ?? "Failed to create ticket");
          }
        })
      );
    } else if (initialIds.has(t.id)) {
      ops.push(
        fetch(`/api/events/${eventId}/tickets/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: t.name, price: t.price, quantity: t.quantity, benefits: t.benefits, displayOrder: i }),
        }).then(async (r) => {
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            throw new Error(j.error ?? "Failed to update ticket");
          }
        })
      );
    }
  }

  await Promise.all(ops);
}

type Performer = {
  id?: string;
  name: string;
  imageUrl: string | null;
};

async function syncPerformers(eventId: string, initial: Performer[], current: Performer[]) {
  const currentIds = new Set(current.map((p) => p.id).filter(Boolean));
  const ops: Promise<unknown>[] = [];

  for (const p of initial) {
    if (p.id && !currentIds.has(p.id)) {
      ops.push(
        fetch(`/api/events/${eventId}/performers/${p.id}`, { method: "DELETE" }).then(async (r) => {
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            throw new Error(j.error ?? "Failed to delete performer");
          }
        })
      );
    }
  }

  for (const p of current) {
    if (!p.id) {
      ops.push(
        fetch(`/api/events/${eventId}/performers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: p.name, imageUrl: p.imageUrl }),
        }).then(async (r) => {
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            throw new Error(j.error ?? "Failed to create performer");
          }
        })
      );
    }
  }

  await Promise.all(ops);
}

type Voucher = {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  amount: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
};

async function syncVouchers(eventId: string, initial: Voucher[], current: Voucher[]) {
  const currentIds = new Set(current.map((v) => v.id).filter(Boolean));
  const deletes: Promise<unknown>[] = [];
  const creates: Promise<unknown>[] = [];

  for (const v of initial) {
    if (v.id && !currentIds.has(v.id)) {
      deletes.push(
        fetch(`/api/events/${eventId}/vouchers`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voucherId: v.id }),
        }).then(async (r) => {
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            throw new Error(j.error ?? "Failed to delete voucher");
          }
        })
      );
    }
  }

  await Promise.all(deletes);

  for (const v of current) {
    if (!v.id) {
      creates.push(
        fetch(`/api/events/${eventId}/vouchers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: v.code,
            type: v.type,
            amount: v.amount,
            usageLimit: v.usageLimit ?? null,
            expiresAt: v.expiresAt ?? null,
          }),
        }).then(async (r) => {
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            throw new Error(j.error ?? "Failed to create voucher");
          }
        })
      );
    }
  }

  await Promise.all(creates);
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetch(`/api/events/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: async ({ formData, tickets, performers, vouchers, publish }: { formData: Record<string, unknown>; tickets: TicketType[]; performers: Performer[]; vouchers: Voucher[]; publish: boolean }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");

      await syncTickets(id, data?.tickets ?? [], tickets);
      await syncPerformers(id, data?.performers ?? [], performers);
      await syncVouchers(id, data?.vouchers ?? [], vouchers);

      if (publish && json.event?.status !== "published") {
        const publishRes = await fetch(`/api/events/${id}/publish`, { method: "POST" });
        if (!publishRes.ok) throw new Error("Failed to publish event");
      }
    },
    onSuccess: () => {
      toast.success("Perubahan disimpan");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyimpan perubahan");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${id}/unpublish`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to unpublish");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      toast.success("Event di-unpublish");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${id}/duplicate`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed to duplicate");
      return j.id as string;
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event diduplikat");
      router.push(`/events/${newId}/edit`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to delete");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event dihapus");
      router.push("/events");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave(formData: Record<string, unknown>, tickets: TicketType[], performers: Performer[], vouchers: Voucher[], publish: boolean) {
    mutation.mutate({ formData, tickets, performers, vouchers, publish });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <EventForm
      key={data?.event?.updatedAt ?? id}
      title="Edit Event"
      saving={mutation.isPending}
      initialData={data?.event}
      initialTickets={data?.tickets ?? []}
      initialPerformers={data?.performers ?? []}
      initialVouchers={data?.vouchers ?? []}
      eventId={id}
      status={data?.event?.status}
      paidOrderCount={data?.paidOrderCount ?? 0}
      onSave={handleSave}
      onUnpublish={() => unpublishMutation.mutate()}
      onDuplicate={() => duplicateMutation.mutate()}
      onDelete={() => deleteMutation.mutate()}
      actionPending={
        unpublishMutation.isPending || duplicateMutation.isPending || deleteMutation.isPending
      }
    />
  );
}
