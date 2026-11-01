import { test, expect, rp } from "../lib/fixtures";
import { createEvent, createOrg, createUser, q, rid } from "../lib/db";
import { urls } from "../lib/env";

test.describe("web: browse", () => {
  test("home, search, event detail, favorite toggle", async ({ page, loginAs }) => {
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id });
    const unique = `Zephyr${rid(6)}`;
    const ev = await createEvent({
      orgId: org.id,
      name: `E2E ${unique} Night`,
      tickets: [{ name: "Festival", price: 150_000, quantity: 50 }],
    });

    await page.goto(urls.web + "/");
    await expect(page.locator(`a[href="/events/${ev.id}"]`).first()).toBeVisible();
    const banners = await q(`select tag from banner where is_active and deleted_at is null order by display_order, created_at`);
    if (banners.length) {
      await expect(page.getByAltText(banners[0]!.tag).first()).toBeAttached();
    }

    const search = page.getByPlaceholder("Cari acara, kota, atau venue...").first();
    await search.fill(unique);
    const suggestion = page.getByRole("button", { name: new RegExp(unique) });
    await expect(suggestion).toBeVisible();
    await search.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/events\\?q=${unique}`));
    await expect(page.locator(`a[href="/events/${ev.id}"]`).first()).toBeVisible();
    await page.goto(urls.web + `/events?q=nomatch${rid(8)}`);
    await expect(page.locator(`a[href="/events/${ev.id}"]`)).toHaveCount(0);

    await page.goto(urls.web + `/events/${ev.id}`);
    await expect(page.getByText(ev.name).first()).toBeVisible();
    await expect(page.getByText("Festival", { exact: true })).toBeVisible();
    await expect(page.getByText(rp(150_000)).first()).toBeVisible();
    await expect(page.getByText(`By : ${org.name}`)).toBeVisible();

    const buyer = await createUser();
    await loginAs(buyer.id, "web");
    await page.reload();
    const save = page.getByRole("button", { name: "Simpan ke favorit" });
    await expect(save).toBeVisible();
    await save.click();
    await expect(page.getByRole("button", { name: "Hapus dari favorit" })).toBeVisible();
    await expect
      .poll(async () => (await q(`select 1 from favorite where user_id=$1 and event_id=$2`, [buyer.id, ev.id])).length)
      .toBe(1);

    await page.reload();
    await page.getByRole("button", { name: "Hapus dari favorit" }).click();
    await expect(page.getByRole("button", { name: "Simpan ke favorit" })).toBeVisible();
    await expect
      .poll(async () => (await q(`select 1 from favorite where user_id=$1 and event_id=$2`, [buyer.id, ev.id])).length)
      .toBe(0);
  });
});
