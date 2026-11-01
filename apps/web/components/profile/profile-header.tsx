"use client";

import { Instagram, Mail, Pencil, Ticket, MessageCircle, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { EditProfileDialog } from "./edit-profile-dialog";
import type { ProfileData } from "./profile-client";

export function ProfileHeader({ data }: { data: ProfileData }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="relative">
      <div
        className="h-44 w-full bg-cover bg-center sm:h-56 md:h-96"
        style={
          data.coverImage
            ? { backgroundImage: `url(${data.coverImage})` }
            : {
                backgroundColor: "oklch(0.85 0.07 25)",
                backgroundImage:
                  "radial-gradient(at 18% 24%, oklch(0.88 0.11 42) 0px, transparent 50%), radial-gradient(at 72% 14%, oklch(0.84 0.12 350) 0px, transparent 50%), radial-gradient(at 50% 92%, oklch(0.82 0.11 312) 0px, transparent 55%), radial-gradient(at 90% 70%, oklch(0.89 0.10 68) 0px, transparent 50%)",
              }
        }
      />
      <div className="mx-auto -mt-14 flex max-w-5xl flex-col gap-4 px-5 pb-4 md:-mt-56 md:flex-row md:items-end md:gap-6 md:px-6">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-neutral-200 md:h-44 md:w-44">
          {data.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.image} alt={data.name} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1 md:pb-2">
          <h1
            className="text-3xl font-semibold leading-tight tracking-[-0.02em] text-[#155e54] md:text-[2.5rem] md:leading-none"
            style={{ fontFamily: "var(--font-ibm)" }}
          >
            {data.name}
          </h1>
          <p className="mt-1 text-sm text-[#0C2D57]/70">Sejak {data.memberSince}</p>
          {data.location && <p className="font-semibold text-[#0C2D57]">{data.location}</p>}
          <div className="mt-1 space-y-0.5 text-sm text-[#0C2D57]">
            {data.instagram && (
              <p className="flex items-center gap-1.5"><Instagram className="h-4 w-4" />@{data.instagram}</p>
            )}
            <p className="flex min-w-0 items-center gap-1.5"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{data.email}</span></p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-start">
          <button
            onClick={() => setEditing(true)}
            className="order-2 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0C2D57] shadow md:order-none"
          >
            <Pencil className="h-4 w-4" /> Edit Profil
          </button>
          <div className="order-1 flex items-center gap-4 rounded-xl bg-black/20 px-5 py-3 text-white backdrop-blur-sm md:order-none">
            <Stat icon={Ticket} n={data.eventCount} label="Event" />
            <span className="h-6 w-px bg-white/30" />
            <Stat icon={MessageCircle} n={data.commentCount} label="Komentar" />
          </div>
        </div>
      </div>
      {editing && <EditProfileDialog data={data} onClose={() => setEditing(false)} />}
    </div>
  );
}

function Stat({ icon: Icon, n, label }: { icon: LucideIcon; n: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-white/90" />
      <span className="font-bold">{n}</span>
      <span className="text-sm text-white/80">{label}</span>
    </div>
  );
}
