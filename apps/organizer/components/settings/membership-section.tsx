"use client";

import { authClient } from "../../lib/auth-client";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";

export function MembershipSection({ role, orgId }: { role?: string; orgId?: string }) {
  return (
    <section className="space-y-4 rounded-lg border p-5">
      <h2 className="font-semibold">Membership</h2>
      <div className="flex items-center justify-between text-sm">
        <span>Your role</span>
        <Badge>{role ?? "—"}</Badge>
      </div>
      {role !== "owner" && orgId && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-destructive">
              Leave organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave organization?</DialogTitle>
              <DialogDescription>
                You will lose access to this organization&apos;s events and data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                className="text-destructive"
                onClick={async () => {
                  await authClient.organization.leave({ organizationId: orgId });
                  window.location.href = "/dashboard";
                }}
              >
                Leave
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
