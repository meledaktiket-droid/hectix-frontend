"use server";

import { api } from "../../../lib/api";

type Result =
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "needs-signin"; email: string; roleLabel: string }
  | { status: "mismatch"; invitedEmail: string; signedInEmail: string }
  | { status: "accepted" };

export async function inspectInvite(token: string): Promise<Result> {
  return api<Result>("/api/team/invitations/accept", { method: "POST", body: { token } });
}
