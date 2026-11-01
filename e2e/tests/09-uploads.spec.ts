import { rmSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "../lib/fixtures";
import { createSession } from "../lib/auth";
import { createOrg, createUser, one, q, rid } from "../lib/db";
import { env, urls } from "../lib/env";
import { PDF_MIN, PNG_1x1 } from "../lib/files";

const created: string[] = [];
test.afterAll(() => {
  if (!env.uploadDir) return;
  for (const rel of created) rmSync(join(env.uploadDir, rel), { force: true });
});

test.describe("uploads", () => {
  test("organizer uploads an event banner in the UI; it is served at /uploads/...", async ({ page, loginAs }) => {
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id, status: "active" });
    await loginAs(owner.id, "organizer", { activeOrganizationId: org.id });

    await page.goto(urls.organizer + "/events/create");
    const name = `E2E Banner Event ${rid(6)}`;
    await page.getByPlaceholder("e.g. Loud Fest 2025").fill(name);
    const put = page.waitForResponse((r) => r.url().includes("/api/upload/put?t=") && r.request().method() === "PUT");
    const chooser = page.waitForEvent("filechooser");
    await page.getByText("Drop image here").click();
    await (await chooser).setFiles({ name: "banner.png", mimeType: "image/png", buffer: PNG_1x1 });
    expect((await put).status()).toBeLessThan(300);
    const banner = page.getByAltText("Banner");
    await expect(banner).toBeVisible();
    const src = (await banner.getAttribute("src"))!;
    expect(src).toMatch(new RegExp(`^${urls.organizer}/uploads/events/banners/[0-9a-f-]{36}\\.png$`));
    const key = src.slice(src.indexOf("/uploads/") + "/uploads/".length);
    created.push(join("public", key));

    const img = await page.request.get(src);
    expect(img.status()).toBe(200);
    expect(img.headers()["content-type"]).toContain("image/png");
    expect(Buffer.compare(await img.body(), PNG_1x1)).toBe(0);
    expect((await page.request.get(urls.web + `/uploads/${key}`)).status()).toBe(200);

    const save = page.waitForResponse((r) => r.url().endsWith("/api/events") && r.request().method() === "POST");
    await page.getByRole("button", { name: "Save Draft" }).click();
    expect((await save).status()).toBe(201);
    await expect(page).toHaveURL(/\/events\/[^/]+\/edit$/);
    const ev = await one(`select banner_url, status from event where organization_id=$1 and name=$2`, [org.id, name]);
    expect(ev).toEqual({ banner_url: src, status: "draft" });
  });

  test("a private verification file is only visible to its uploader (and their org)", async ({ api }) => {
    const alice = await createUser();
    const bob = await createUser();
    const sa = await createSession(alice.id, "organizer");
    const asAlice = await api(sa, "organizer");

    const grant = await asAlice.post("/api/upload", {
      data: { filename: "ktp.pdf", contentType: "application/pdf", size: PDF_MIN.length },
    });
    expect(grant.status()).toBe(200);
    const g = await grant.json();
    expect(g.key).toMatch(new RegExp(`^verification/${alice.id}/[0-9a-f-]{36}\\.pdf$`));
    expect(g.publicUrl).toBe(`${urls.organizer}/api/files/${g.key}`);
    created.push(join("private", g.key));
    const put = await asAlice.put(g.url, { data: PDF_MIN, headers: { "Content-Type": "application/pdf" } });
    expect(put.status()).toBeLessThan(300);

    const mine = await asAlice.get(`/api/files/${g.key}`);
    expect(mine.status()).toBe(200);
    expect(Buffer.compare(await mine.body(), PDF_MIN)).toBe(0);

    for (const app of ["organizer", "web"] as const) {
      const asBob = await api(await createSession(bob.id, app), app);
      expect((await asBob.get(`/api/files/${g.key}`)).status(), app).toBe(404);
    }
    expect((await (await api(null, "organizer")).get(`/api/files/${g.key}`)).status()).toBe(401);
    expect((await (await api(null, "organizer")).get(`/uploads/${g.key}`)).status()).toBe(404);

    const sneaky = await (await api(await createSession(bob.id, "organizer"), "organizer")).post("/api/upload", {
      data: { filename: "x.pdf", contentType: "application/pdf", size: 10, folder: `verification/${alice.id}` },
    });
    expect(sneaky.status()).toBe(400);

    const org = await createOrg({ ownerId: alice.id, status: "review", members: [{ userId: bob.id, role: "admin" }] });
    await q(`update organization set verification_data=$2 where id=$1`, [org.id, JSON.stringify({ ktpUrl: g.publicUrl })]);
    const asBob = await api(await createSession(bob.id, "organizer"), "organizer");
    expect((await asBob.get(`/api/files/${g.key}`)).status()).toBe(200);
  });
});
