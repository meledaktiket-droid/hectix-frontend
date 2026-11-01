"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "../../../lib/auth-client";
import { Ticket, Plus, Calendar, MapPin, Edit2 } from "lucide-react";

type EventStatus = "draft" | "published";

type Event = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  venueName: string | null;
  city: string | null;
  status: EventStatus;
  soldCount: number;
  capacity: number;
};

function StatusBadge({ status }: { status: EventStatus }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
      Draft
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EventsPage() {
  const { data: activeOrg } = authClient.useActiveOrganization();

  const { data, isLoading } = useQuery({
    queryKey: ["events", activeOrg?.id],
    queryFn: () => fetch("/api/events").then((r) => r.json()),
    enabled: !!activeOrg?.id,
  });

  const events: Event[] = data?.events ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage events for {activeOrg?.name ?? "your organization"}.
          </p>
        </div>
        <Link
          href="/events/create"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          Create event
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-lg border divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="h-4 w-48 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <Ticket className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No events yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            Create your first event to start selling tickets.
          </p>
          <Link
            href="/events/create"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Create event
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{ev.name}</p>
                  <StatusBadge status={ev.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(ev.startsAt)}
                    {ev.endsAt && ev.endsAt !== ev.startsAt && ` – ${formatDate(ev.endsAt)}`}
                  </span>
                  {(ev.venueName || ev.city) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {[ev.venueName, ev.city].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {ev.capacity > 0 && (
                    <span className="flex items-center gap-1">
                      <Ticket className="size-3" />
                      {ev.soldCount} / {ev.capacity} terjual
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/events/${ev.id}`}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground border hover:bg-muted transition-colors"
                >
                  Lihat
                </Link>
                <Link
                  href={`/events/${ev.id}/edit`}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground border hover:bg-muted transition-colors"
                >
                  <Edit2 className="size-3" />
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
