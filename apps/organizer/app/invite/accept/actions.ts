"use server";

import { api } from "../../../lib/api";

type Result =
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "needs-signin"; email: string; orgName: string; roleLabel: string; inviterName: string }
  | { status: "mismatch"; invitedEmail: string; signedInEmail: string }
  | { status: "needs-accept"; is_volunteer?: boolean }
  | { status: "accepted" };

type Inspect = Result | { status: "needs-accept"; is_volunteer?: boolean };

export async function inspectOrgInvite(id: string): Promise<Result> {
  const res = await api<Inspect>("/api/invitations/inspect", { method: "POST", body: { id } });
  if (res.status !== "needs-accept") return res;

  // Volunteer scanner: tampilkan pilihan Terima/Tolak eksplisit
  if (res.is_volunteer) {
    return res;
  }

  // Member EO biasa (admin/member): pertahankan perilaku legacy (auto-accept saat login)
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

export async function acceptOrgInvite(id: string): Promise<{ ok: boolean }> {
  const accepted = await api<{ member: { organizationId: string } }>(
    "/api/auth/organization/accept-invitation",
    { method: "POST", body: { invitationId: id } },
  );

  await api("/api/auth/organization/set-active", {
    method: "POST",
    body: { organizationId: accepted.member.organizationId },
  });

  return { ok: true };
}

export async function rejectOrgInvite(id: string): Promise<{ ok: boolean }> {
  await api("/api/auth/organization/reject-invitation", {
    method: "POST",
    body: { invitationId: id },
  });
  return { ok: true };
}
