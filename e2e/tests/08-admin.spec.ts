import { readFileSync, rmSync } from "node:fs";
import { test, expect } from "../lib/fixtures";
import { createSession } from "../lib/auth";
import { createOrg, createPayoutRequest, createUser, one, q, resendUser } from "../lib/db";
import { env, urls } from "../lib/env";
import { PNG_1x1 } from "../lib/files";
import { join } from "node:path";

test.describe("admin", () => {
  test("super_admin: orgs list, approve a pending org", async ({ page, loginAs }) => {
    const admin = await createUser({ role: "super_admin", name: "E2E Super Admin" });
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id, status: "pending" });
    await loginAs(admin.id, "admin");

    await page.goto(urls.admin + "/orgs");
    await page.getByText(org.name).click();
    await expect(page).toHaveURL(new RegExp(`/orgs/${org.id}$`));

    await page.getByRole("button", { name: "Approve", exact: true }).click();
    const patch = page.waitForResponse((r) => r.url().endsWith(`/api/orgs/${org.id}`) && r.request().method() === "PATCH");
    await page.getByRole("button", { name: "Confirm: Approve" }).click();
    expect((await patch).status()).toBe(200);

    expect((await one(`select status from organization where id=$1`, [org.id])).status).toBe("active");
    const hist = await q(`select from_status, to_status, actor_id, actor_type from organization_status_history where organization_id=$1`, [org.id]);
    expect(hist).toEqual([{ from_status: "pending", to_status: "active", actor_id: admin.id, actor_type: "admin" }]);
  });

  test("super_admin: process a payout with an uploaded transfer proof", async ({ page, loginAs }) => {
    const admin = await createUser({ role: "super_admin" });
    const sink = await resendUser();
    const org = await createOrg({ ownerId: sink.id, status: "active" });
    expect(await q(`select u.email from member m join "user" u on u.id=m.user_id where m.organization_id=$1`, [org.id]))
      .toEqual([{ email: sink.email }]);
    const payout = await createPayoutRequest(org.id, 250_000);
    await loginAs(admin.id, "admin");

    let uploadedKey = "";
    await page.route("**/api/upload", async (route) => {
      const res = await route.fetch();
      const json = await res.json();
      uploadedKey = json.key;
      await route.fulfill({ response: res, json: { ...json, publicUrl: `/uploads/${json.key}` } });
    });

    await page.goto(urls.admin + `/payouts/${payout.id}`);
    await expect(page.getByRole("heading", { name: "Payout request" })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "proof.png", mimeType: "image/png", buffer: PNG_1x1 });
    await expect(page.getByAltText("Transfer proof")).toBeVisible();
    const proc = page.waitForResponse((r) => r.url().endsWith(`/api/payouts/${payout.id}/process`));
    await page.getByRole("button", { name: "Mark as Paid" }).click();
    expect((await proc).status()).toBe(200);
    await expect(page.getByText(/Paid by/)).toBeVisible();

    const row = await one(`select status, processed_by, proof_url, processed_at from payout_request where id=$1`, [payout.id]);
    expect(row).toMatchObject({ status: "processed", processed_by: admin.id, proof_url: `/uploads/${uploadedKey}` });
    expect(row.processed_at).toBeTruthy();
    const img = await page.request.get(urls.admin + `/uploads/${uploadedKey}`);
    expect(img.status()).toBe(200);
    expect(Buffer.compare(await img.body(), PNG_1x1)).toBe(0);
    if (env.uploadDir) rmSync(join(env.uploadDir, "public", uploadedKey), { force: true });
  });

  test("super_admin: export orders CSV (UI download + API)", async ({ page, loginAs, api }) => {
    const admin = await createUser({ role: "super_admin" });
    const s = await loginAs(admin.id, "admin");

    await page.goto(urls.admin + "/orders");
    const exportBtn = page.getByRole("button", { name: "Export" });
    await expect(exportBtn).toBeEnabled();
    const [download] = await Promise.all([page.waitForEvent("download"), exportBtn.click()]);
    expect(download.suggestedFilename()).toMatch(/^orders-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = readFileSync(await download.path(), "utf8");
    expect(csv.split("\n").length).toBeGreaterThan(1);

    const res = await (await api(s, "admin")).get("/api/orders/export");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("text/csv; charset=utf-8");
    expect(res.headers()["content-disposition"]).toContain("attachment");
  });

  test("non-staff users are blocked from admin", async ({ page, loginAs, api }) => {
    const user = await createUser({ role: "user" });
    const s = await loginAs(user.id, "admin");
    await page.goto(urls.admin + "/dashboard");
    await expect(page).toHaveURL(urls.admin + "/");

    const asUser = await api(s, "admin");
    for (const path of ["/api/orgs", "/api/payouts", "/api/orders/export", "/api/dashboard"]) {
      const r = await asUser.get(path);
      expect(r.status(), path).toBe(403);
      expect(await r.json()).toEqual({ error: "Forbidden" });
    }
    expect((await (await api(null, "admin")).get("/api/orgs")).status()).toBe(401);

    const staff = await createUser({ role: "staff" });
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id, status: "pending" });
    const asStaff = await api(await createSession(staff.id, "admin"), "admin");
    expect((await asStaff.get("/api/orgs")).status()).toBe(200);
    const r = await asStaff.patch(`/api/orgs/${org.id}`, { data: { status: "active" } });
    expect(r.status()).toBe(403);
    expect((await one(`select status from organization where id=$1`, [org.id])).status).toBe("pending");
  });
});
