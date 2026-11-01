"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EventForm } from "../_components/EventForm";

type TicketType = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  benefits: string[];
};

type Performer = {
  id?: string;
  name: string;
  imageUrl: string | null;
};

type Voucher = {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  amount: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
};

export default function CreateEventPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ data, tickets, performers, vouchers, publish }: { data: Record<string, unknown>; tickets: TicketType[]; performers: Performer[]; vouchers: Voucher[]; publish: boolean }) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");

      const eventId = json.event.id;

      const ticketResponses = await Promise.all(
        tickets.map((ticket) =>
          fetch(`/api/events/${eventId}/tickets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: ticket.name, price: ticket.price, quantity: ticket.quantity, benefits: ticket.benefits }),
          })
        )
      );
      for (const r of ticketResponses) {
        if (!r.ok) throw new Error("Failed to create ticket");
      }

      const performerResponses = await Promise.all(
        performers.map((p) =>
          fetch(`/api/events/${eventId}/performers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: p.name, imageUrl: p.imageUrl }),
          })
        )
      );
      for (const r of performerResponses) {
        if (!r.ok) throw new Error("Failed to create performer");
      }

      const voucherResponses = await Promise.all(
        vouchers.map((v) =>
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
          })
        )
      );
      for (const r of voucherResponses) {
        if (!r.ok) throw new Error("Failed to create voucher");
      }

      if (publish) {
        const publishRes = await fetch(`/api/events/${eventId}/publish`, { method: "POST" });
        if (!publishRes.ok) throw new Error("Failed to publish event");
      }

      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.push(`/events/${eventId}/edit`);
    },
  });

  async function handleSave(data: Record<string, unknown>, tickets: TicketType[], performers: Performer[], vouchers: Voucher[], publish: boolean) {
    await mutation.mutateAsync({ data, tickets, performers, vouchers, publish });
  }

  return (
    <EventForm
      title="Create New Event"
      saving={mutation.isPending}
      onSave={handleSave}
    />
  );
}
