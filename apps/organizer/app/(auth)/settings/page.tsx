"use client";

import { useState } from "react";
import { authClient } from "../../../lib/auth-client";
import { ProfileSection } from "../../../components/settings/profile-section";
import { SecuritySection } from "../../../components/settings/security-section";
import { MembershipSection } from "../../../components/settings/membership-section";
import { OrgGeneralSection } from "../../../components/settings/org-general-section";
import { PayoutSection } from "../../../components/settings/payout-section";
import { VerificationSection } from "../../../components/settings/verification-section";

type Tab = "account" | "organization";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const myRole = activeOrg?.members?.find((m) => m.userId === session?.user?.id)?.role as
    | "owner" | "admin" | "member" | undefined;
  const canSeeOrgTab = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";

  const [tab, setTab] = useState<Tab>("account");
  const active = !canSeeOrgTab ? "account" : tab;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and organization.</p>
      </div>

      <div className="flex gap-1 border-b">
        <TabButton active={active === "account"} onClick={() => setTab("account")}>Account</TabButton>
        {canSeeOrgTab && (
          <TabButton active={active === "organization"} onClick={() => setTab("organization")}>Organization</TabButton>
        )}
      </div>

      {active === "account" && (
        <div className="space-y-6">
          <ProfileSection />
          <SecuritySection />
          <MembershipSection role={myRole} orgId={activeOrg?.id} />
        </div>
      )}
      {active === "organization" && canSeeOrgTab && (
        <div className="space-y-6">
          {activeOrg && <OrgGeneralSection org={activeOrg} />}
          {isOwner && <PayoutSection />}
          {isOwner && <VerificationSection />}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
