import { test, expect, collectDialogs } from "../lib/fixtures";
import { createEvent, createOrg, createUser, createVoucher, one } from "../lib/db";
import { createSession } from "../lib/auth";
import { choosePayment, pickTickets, redeemVoucher, submitCheckout } from "../lib/web";

test.describe("web: QRIS order then buyer cancel", () => {
  test("cancel from the pay page releases stock and the voucher use", async ({ page, loginAs, api }) => {
    const dialogs = collectDialogs(page);
    const buyer = await createUser();
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id });
    const ev = await createEvent({ orgId: org.id, tickets: [{ name: "Presale", price: 75_000, quantity: 10 }] });
    const tt = ev.tickets[0]!;
    const v = await createVoucher({ eventId: ev.id, type: "fixed", amount: 10_000, usageLimit: 5 });

    const s = await loginAs(buyer.id, "web");
    await pickTickets(page, ev.id, "Presale", 2);
    await choosePayment(page, "qris");
    await redeemVoucher(page, v.code.toLowerCase());
    await expect(page.getByText(`Voucher ${v.code} diterapkan`)).toBeVisible();
    const orderId = await submitCheckout(page);
    expect(dialogs).toEqual([]);

    const pending = await one(`select * from "order" where id=$1`, [orderId]);
    expect(pending).toMatchObject({ status: "pending_payment", payment_method: "qris", bank: null, voucher_code: v.code, voucher_discount: 10_000 });
    expect(pending.qris_url).toMatch(/^https:\/\//);
    expect((await one(`select sold from ticket_type where id=$1`, [tt.id])).sold).toBe(2);
    expect((await one(`select usage_count from voucher where id=$1`, [v.id])).usage_count).toBe(1);
    await expect(page.getByAltText("QRIS")).toBeVisible();

    await page.locator("header button").first().click();
    await expect(page.getByText("Batalkan pesanan?")).toBeVisible();
    const del = page.waitForResponse((r) => r.url().endsWith(`/api/orders/${orderId}`) && r.request().method() === "DELETE");
    await page.getByRole("button", { name: "Ya, batalkan" }).click();
    expect((await del).status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/events/${ev.id}/checkout`));

    const cancelled = await one(`select status from "order" where id=$1`, [orderId]);
    expect(cancelled.status).toBe("cancelled");
    expect((await one(`select sold from ticket_type where id=$1`, [tt.id])).sold).toBe(0);
    expect((await one(`select usage_count from voucher where id=$1`, [v.id])).usage_count).toBe(0);

    const web = await api(s);
    const again = await web.delete(`/api/orders/${orderId}`);
    expect(again.status()).toBe(400);
    const other = await createUser();
    const otherApi = await api(await createSession(other.id, "web"));
    expect((await otherApi.get(`/api/orders/${orderId}`)).status()).toBe(404);
    expect((await otherApi.delete(`/api/orders/${orderId}`)).status()).toBe(404);
  });
});
