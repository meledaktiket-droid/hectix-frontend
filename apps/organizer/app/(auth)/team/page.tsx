"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "../../../lib/auth-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { UserPlus, Trash2, Users, Mail, RotateCw } from "lucide-react";

const ROLES = ["owner", "admin", "member"] as const;
type Role = typeof ROLES[number];

type ListInvitationsResult = Awaited<
  ReturnType<typeof authClient.organization.listInvitations>
>;
type Invitation = NonNullable<ListInvitationsResult["data"]>[number];

function MemberAvatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (image) {
    return <img src={image} alt={name} className="size-7 rounded-full object-cover" />;
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {initials}
    </span>
  );
}

export default function UsersPage() {
  const { data: activeOrg, refetch } = authClient.useActiveOrganization();
  const members = activeOrg?.members ?? [];

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  const [invites, setInvites] = useState<Invitation[]>([]);

  const loadInvites = useCallback(async () => {
    if (!activeOrg) return;
    const { data } = await authClient.organization.listInvitations({
      query: { organizationId: activeOrg.id },
    });
    setInvites((data ?? []).filter((inv) => inv.status === "pending"));
  }, [activeOrg]);

  useEffect(() => {
    if (!activeOrg?.id) return;
    loadInvites();
  }, [activeOrg?.id, loadInvites]);

  const resendMutation = useMutation<unknown, Error, Invitation>({
    mutationFn: async (invite) => {
      if (!activeOrg) return;
      await authClient.organization.inviteMember({
        organizationId: activeOrg.id,
        email: invite.email,
        role: invite.role as Role,
        resend: true,
      });
    },
    onSuccess: () => loadInvites(),
  });

  const cancelMutation = useMutation<unknown, Error, Invitation>({
    mutationFn: async (invite) => {
      await authClient.organization.cancelInvitation({ invitationId: invite.id });
    },
    onSuccess: () => loadInvites(),
  });

  const inviteMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!activeOrg) return;
      const { error } = await authClient.organization.inviteMember({
        organizationId: activeOrg.id,
        email: inviteEmail,
        role: inviteRole,
        resend: false,
      });
      if (error) throw new Error(error.message ?? "Failed to invite member.");
    },
    onSuccess: () => {
      setInviteEmail("");
      setInviteRole("member");
      setInviteOpen(false);
      refetch?.();
      loadInvites();
    },
  });

  const roleChangeMutation = useMutation<unknown, Error, { memberId: string; role: Role }>({
    mutationFn: async ({ memberId, role }) => {
      await authClient.organization.updateMemberRole({ memberId, role });
    },
    onSuccess: () => {
      refetch?.();
    },
  });

  const removeMutation = useMutation<unknown, Error, string>({
    mutationFn: async (memberId) => {
      await authClient.organization.removeMember({ memberIdOrEmail: memberId });
    },
    onSuccess: () => {
      setRemoveTarget(null);
      refetch?.();
    },
  });

  function handleInvite() {
    if (!activeOrg) return;
    setInviteError(null);
    inviteMutation.mutate(undefined, {
      onError: (error) => setInviteError(error.message),
    });
  }

  function handleRoleChange(memberId: string, role: Role) {
    roleChangeMutation.mutate({ memberId, role });
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return;
    removeMutation.mutate(removeTarget.id);
  }

  const resendingId = resendMutation.isPending ? resendMutation.variables?.id : null;
  const cancelingId = cancelMutation.isPending ? cancelMutation.variables?.id : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who has access to {activeOrg?.name ?? "this organization"}.
          </p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) setInviteError(null); }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <UserPlus className="size-4" />
              Invite member
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {inviteError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{inviteError}</p>
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
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="invite-role" className="text-sm font-medium">Role</label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={handleInvite}
                disabled={inviteMutation.isPending || !inviteEmail.trim()}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {inviteMutation.isPending ? "Sending..." : "Send invite"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Users className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No members yet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Invite someone to collaborate.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <MemberAvatar name={m.user.name} image={m.user.image} />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{m.user.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{m.user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={m.role}
                      onValueChange={(v) => handleRoleChange(m.id, v as Role)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setRemoveTarget({ id: m.id, name: m.user.name })}
                      title={`Remove ${m.user.name}`}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Pending invitations</h2>
        <div className="rounded-lg border">
          {invites.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Mail className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No pending invitations</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="truncate text-sm font-medium">{invite.email}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Pending
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{invite.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => resendMutation.mutate(invite)}
                          disabled={resendingId === invite.id}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                          <RotateCw className="size-4" />
                          {resendingId === invite.id ? "Sending..." : "Resend"}
                        </button>
                        <button
                          onClick={() => cancelMutation.mutate(invite)}
                          disabled={cancelingId === invite.id}
                          title={`Cancel invitation to ${invite.email}`}
                          aria-label={`Cancel invitation to ${invite.email}`}
                          className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">{removeTarget?.name}</span>{" "}
            from this organization? They will lose access immediately.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setRemoveTarget(null)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveConfirm}
              disabled={removeMutation.isPending}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
