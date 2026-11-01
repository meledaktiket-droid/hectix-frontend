"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProfileHeader } from "./profile-header";
import { ProfileActivityList } from "./profile-activity-list";
import { ProfileActivityDetail } from "./profile-activity-detail";

export type ProfileActivity = {
  orderId: string;
  eventId: string;
  eventName: string;
  eventBannerUrl: string | null;
  eventStartsAt: string;
  tiers: { ticketTypeName: string; quantity: number }[];
  ticketCount: number;
};

export type ProfileData = {
  name: string;
  email: string;
  image: string | null;
  coverImage: string | null;
  location: string | null;
  gender: string | null;
  instagram: string | null;
  tiktok: string | null;
  memberSince: number;
  eventCount: number;
  commentCount: number;
};

export function ProfileClient() {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: () => fetch("/api/profile").then((r) => r.json()),
  });

  if (isLoading || !data) return <div className="py-20 text-center text-neutral-500">Memuat…</div>;

  return (
    <>
      <ProfileHeader data={data} />
      <div className="mx-auto mt-8 max-w-5xl px-5 md:p-6">
        {openOrderId ? (
          <ProfileActivityDetail orderId={openOrderId} onBack={() => setOpenOrderId(null)} />
        ) : (
          <ProfileActivityList onOpen={setOpenOrderId} />
        )}
      </div>
    </>
  );
}
