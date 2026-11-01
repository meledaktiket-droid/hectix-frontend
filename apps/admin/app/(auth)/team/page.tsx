"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../../../lib/auth-client";
import { ADMIN_ROLES, ROLE_LABELS, type AdminRole } from "../../../lib/roles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import { UserPlus, Users, Mail } from "lucide-react";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

const STAFF_BADGE = { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-foreground/40" };
const ROLE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  super_admin: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-[#a853ba]" },
  admin: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-[#2a8af6]" },
  staff: STAFF_BADGE,
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_BADGE[role] ?? STAFF_BADGE;
  const label = ROLE_LABELS[role as AdminRole] ?? role;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function MemberAvatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} className="size-8 shrink-0 rounded-full object-cover" />;
  }
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {initials || "?"}
    </span>
  );
}

const roleSelectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-1 disabled:opacity-50";

export default function TeamPage() {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const isSuperAdmin =
    (session?.user as { role?: string } | undefined)?.role === "super_admin";

  const queryClient = useQueryClient();

  const membersQuery = useQuery<Member[]>({
    queryKey: ["admin-team-members"],
    queryFn: ({ signal }) =>
      fetch("/api/team/members", { signal }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
  });
  const members = membersQuery.data ?? null;
  const membersError = membersQuery.isError;

  const invitationsQuery = useQuery<Invitation[]>({
    queryKey: ["admin-team-invites"],
    queryFn: ({ signal }) =>
      fetch("/api/team/invitations", { signal }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    enabled: isSuperAdmin,
  });
  const invitations = invitationsQuery.isError
    ? []
    : invitationsQuery.data ?? null;

  const [actionError, setActionError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("staff");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResend, setInviteResend] = useState(false);

  const roleChangeMutation = useMutation({
    mutationFn: async (vars: { id: string; role: string }) => {
      const res = await fetch(`/api/team/members/${vars.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: vars.role }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "This action would lock out the team.");
      }
      if (!res.ok) throw new Error("Failed to update role.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/team/members/${id}`, { method: "DELETE" });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "This action would lock out the team.");
      }
      if (!res.ok) throw new Error("Failed to remove member.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async (vars: { email: string; role: AdminRole }) => {
      const res = await fetch("/api/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: vars.email, role: vars.role }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        const error = new Error(
          data.error ?? "An invitation for this email already exists.",
        ) as Error & { canResend?: boolean };
        error.canResend = data.code === "PENDING";
        throw error;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send invitation.");
      }
    },
    onSuccess: () => {
      resetInviteForm();
      queryClient.invalidateQueries({ queryKey: ["admin-team-invites"] });
    },
    onError: (err: Error & { canResend?: boolean }) => {
      setInviteError(err.message);
      if (err.canResend) setInviteResend(true);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/team/invitations/${id}`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-invites"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/team/invitations/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-invites"] });
    },
  });

  const invitePending = inviteMutation.isPending || resendMutation.isPending;

  function resetInviteForm() {
    setInviteEmail("");
    setInviteRole("staff");
    setInviteOpen(false);
  }

  function handleRoleChange(id: string, role: string) {
    setActionError(null);
    roleChangeMutation.mutate({ id, role });
  }

  function handleRemove(id: string) {
    setActionError(null);
    removeMutation.mutate(id);
  }

  function handleInvite(resend = false) {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviteError(null);
    setInviteResend(false);

    if (resend) {
      const existing = invitations?.find((i) => i.email === email);
      if (existing) {
        resendMutation.mutate(existing.id, {
          onSuccess: () => {
            resetInviteForm();
          },
        });
        return;
      }
    }

    inviteMutation.mutate({ email, role: inviteRole });
  }

  function handleResend(id: string) {
    setActionError(null);
    resendMutation.mutate(id);
  }

  function handleRevoke(id: string) {
    setActionError(null);
    revokeMutation.mutate(id);
  }

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who has access to the Hectix admin panel.
          </p>
        </div>

        {isSuperAdmin && (
          <Dialog
            open={inviteOpen}
            onOpenChange={(o) => {
              setInviteOpen(o);
              if (!o) {
                setInviteError(null);
                setInviteResend(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <button className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-2"
                style={{ backgroundColor: "#2a8af6" }}>
                <UserPlus className="size-4" />
                Invite member
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a team member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {inviteError && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    <p>{inviteError}</p>
                    {inviteResend && (
                      <button
                        onClick={() => handleInvite(true)}
                        disabled={invitePending}
                        className="mt-1 font-medium underline hover:no-underline disabled:opacity-50"
                      >
                        Resend the existing invitation
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="invite-email" className="text-sm font-medium">Email</label>
                  <input
                    id="invite-email"
                    type="email"
                    autoFocus
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="colleague@example.com"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="invite-role" className="text-sm font-medium">Role</label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-1"
                  >
                    {ADMIN_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleInvite()}
                  disabled={invitePending || !inviteEmail.trim()}
                  className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-2"
                  style={{ backgroundColor: "#2a8af6" }}
                >
                  {invitePending ? "Sending..." : "Send invite"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Team members</h2>
        {membersError ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <p className="text-sm font-medium">Failed to load team members</p>
            <button
              onClick={() => membersQuery.refetch()}
              className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#2a8af6" }}
            >
              Retry
            </button>
          </div>
        ) : members === null ? (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  {isSuperAdmin && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 shrink-0 rounded-full bg-muted animate-pulse" />
                        <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-3.5 w-40 rounded bg-muted animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-6 w-20 rounded-full bg-muted animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-3.5 w-20 rounded bg-muted animate-pulse" /></td>
                    {isSuperAdmin && <td className="px-4 py-3" />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Users className="size-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No team members yet</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  {isSuperAdmin && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isSelf = m.id === currentUserId;
                  return (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <MemberAvatar name={m.name} image={m.image} />
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {m.name}
                              {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate">{m.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isSuperAdmin && !isSelf ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            disabled={
                              (roleChangeMutation.isPending &&
                                roleChangeMutation.variables?.id === m.id) ||
                              (removeMutation.isPending &&
                                removeMutation.variables === m.id)
                            }
                            className={roleSelectClass}
                            aria-label={`Role for ${m.name}`}
                          >
                            {ADMIN_ROLES.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                        ) : (
                          <RoleBadge role={m.role} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {!isSelf && (
                            <button
                              onClick={() => handleRemove(m.id)}
                              disabled={
                                removeMutation.isPending &&
                                removeMutation.variables === m.id
                              }
                              className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e92a67] focus-visible:ring-offset-1"
                            >
                              {removeMutation.isPending &&
                              removeMutation.variables === m.id
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isSuperAdmin && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Pending invitations</h2>
          {invitations === null ? (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[...Array(2)].map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-3"><div className="h-3.5 w-48 rounded bg-muted animate-pulse" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <Mail className="size-7 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No pending invitations</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium truncate">{inv.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><RoleBadge role={inv.role} /></td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(inv.expiresAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => handleResend(inv.id)}
                            disabled={
                              resendMutation.isPending &&
                              resendMutation.variables === inv.id
                            }
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-[#2a8af6] transition-colors hover:bg-blue-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-1"
                          >
                            {resendMutation.isPending &&
                            resendMutation.variables === inv.id
                              ? "Resending..."
                              : "Resend"}
                          </button>
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            disabled={
                              revokeMutation.isPending &&
                              revokeMutation.variables === inv.id
                            }
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e92a67] focus-visible:ring-offset-1"
                          >
                            {revokeMutation.isPending &&
                            revokeMutation.variables === inv.id
                              ? "Revoking..."
                              : "Revoke"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
