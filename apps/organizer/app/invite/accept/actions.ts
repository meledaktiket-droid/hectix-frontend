"use server";

import { api } from "../../../lib/api";

type Result =
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "needs-signin"; email: string; orgName: string; roleLabel: string; inviterName: string }
  | { status: "mismatch"; invitedEmail: string; signedInEmail: string }
  | { status: "accepted" };

type Inspect = Result | { status: "needs-accept" };

export async function inspectOrgInvite(id: string): Promise<Result> {
  const res = await api<Inspect>("/api/invitations/inspect", { method: "POST", body: { id } });
  if (res.status !== "needs-accept") return res;

  const accepted = await api<{ member: { organizationId: string } }>(
    "/api/auth/organization/accept-invitation",
    { method: "POST", body: { invitationId: id } },
  );

  await api("/api/auth/organization/set-active", {
    method: "POST",
    body: { organizationId: accepted.member.organizationId },
  });

  return { status: "accepted" };
}
