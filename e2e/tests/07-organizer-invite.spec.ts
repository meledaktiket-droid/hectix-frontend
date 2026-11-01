import { test, expect } from "../lib/fixtures";
import { createSession } from "../lib/auth";
import { createOrg, createUser, one, poll, q, resendUser, RESEND_SINK } from "../lib/db";
import { urls } from "../lib/env";

test.describe("organizer: team invitations", () => {
  test("owner invites delivered@resend.dev as admin; inspect + accept", async ({ page, loginAs, api }) => {
    const owner = await createUser({ name: "E2E Inviting Owner" });
    const org = await createOrg({ ownerId: owner.id, status: "active" });
    await loginAs(owner.id, "organizer", { activeOrganizationId: org.id });

    await page.goto(urls.organizer + "/team");
    await page.getByRole("button", { name: "Invite member" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Invite a member")).toBeVisible();
    await dialog.getByLabel("Email").fill(RESEND_SINK);
    await dialog.locator("#invite-role").click();
    await page.getByRole("option", { name: "admin" }).click();
    const invite = page.waitForResponse((r) => r.url().endsWith("/api/auth/organization/invite-member"));
    await dialog.getByRole("button", { name: "Send invite" }).click();
    expect((await invite).status()).toBe(200);
    await expect(dialog).toBeHidden();

    const inv = await poll(async () => (await q(`select * from invitation where organization_id=$1`, [org.id]))[0], { what: "invitation row" });
    expect(inv).toMatchObject({ email: RESEND_SINK, role: "admin", status: "pending", inviter_id: owner.id });
    expect(inv.expires_at.getTime()).toBeGreaterThan(Date.now());
    await expect(page.getByText(RESEND_SINK)).toBeVisible();

    const anon = await api(null, "organizer");
    let r = await anon.post("/api/invitations/inspect", { data: { id: inv.id } });
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({
      status: "needs-signin", email: RESEND_SINK, orgName: org.name, roleLabel: "Admin", inviterName: "E2E Inviting Owner",
    });
    r = await anon.post("/api/invitations/inspect", { data: { id: "does-not-exist" } });
    expect(await r.json()).toEqual({ status: "invalid" });

    const stranger = await createUser();
    const asStranger = await api(await createSession(stranger.id, "organizer"), "organizer");
    r = await asStranger.post("/api/invitations/inspect", { data: { id: inv.id } });
    expect(await r.json()).toEqual({ status: "mismatch", invitedEmail: RESEND_SINK, signedInEmail: stranger.email });

    const invitee = await resendUser();
    const asInvitee = await api(await createSession(invitee.id, "organizer"), "organizer");
    r = await asInvitee.post("/api/invitations/inspect", { data: { id: inv.id } });
    expect(await r.json()).toEqual({ status: "needs-accept" });
    r = await asInvitee.post("/api/auth/organization/accept-invitation", { data: { invitationId: inv.id } });
    expect(r.status()).toBe(200);
    expect((await one(`select role from member where organization_id=$1 and user_id=$2`, [org.id, invitee.id])).role).toBe("admin");
    expect((await one(`select status from invitation where id=$1`, [inv.id])).status).toBe("accepted");
    r = await asInvitee.post("/api/invitations/inspect", { data: { id: inv.id } });
    expect(await r.json()).toEqual({ status: "accepted" });
  });
});
