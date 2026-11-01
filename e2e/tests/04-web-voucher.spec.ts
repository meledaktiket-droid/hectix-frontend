import { test, expect, rp, collectDialogs } from "../lib/fixtures";
import { createEvent, createOrg, createUser, createVoucher, one, settings } from "../lib/db";
import { choosePayment, pickTickets, redeemVoucher, submitCheckout, summaryValue } from "../lib/web";

const jsRound = (x: number) => Math.floor(x + 0.5);

test.describe("web: percent voucher in checkout", () => {
  test("discount, tax and total match the server's math", async ({ page, loginAs, api }) => {
    const dialogs = collectDialogs(page);
    const buyer = await createUser();
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id });
    const price = 123_457;
    const ev = await createEvent({ orgId: org.id, tickets: [{ name: "VIP", price, quantity: 10 }] });
    const v = await createVoucher({ eventId: ev.id, type: "percent", amount: 15 });
    const st = await settings();

    const gross = price * 3;
    const discount = Math.min(jsRound((gross * 15) / 100), gross);
    const discounted = gross - discount;
    const tax = jsRound((discounted * st.taxPercent) / 100);
    const fee = jsRound(st.serviceFee);
    const total = discounted + tax + fee;

    const s = await loginAs(buyer.id, "web");
    await pickTickets(page, ev.id, "VIP", 3);
    await choosePayment(page, { bank: "Bank Rakyat Indonesia" });

    await redeemVoucher(page, "NOPE-" + v.code);
    await expect(page.getByText("Kode tidak ditemukan")).toBeVisible();
    await expect(page.getByText("Diskon Voucher")).toHaveCount(0);

    await redeemVoucher(page, v.code);
    await expect(page.getByText(`Voucher ${v.code} diterapkan (15%)`)).toBeVisible();
    await expect(summaryValue(page, "Diskon Voucher")).toHaveText(`-${rp(discount)}`);
    await expect(summaryValue(page, "Subtotal")).toHaveText(rp(discounted));
    await expect(summaryValue(page, "Pajak")).toHaveText(rp(tax));
    await expect(summaryValue(page, "Biaya layanan")).toHaveText(rp(fee));
    await expect(summaryValue(page, "Total (3 tiket)")).toHaveText(rp(total));

    const orderId = await submitCheckout(page);
    expect(dialogs).toEqual([]);
    const o = await one(`select * from "order" where id=$1`, [orderId]);
    expect(o).toMatchObject({
      subtotal: discounted, voucher_discount: discount, tax, service_fee: fee, total,
      voucher_code: v.code, bank: "bri", status: "pending_payment",
    });
    expect((await one(`select usage_count from voucher where id=$1`, [v.id])).usage_count).toBe(1);

    await expect(summaryValue(page, "Total (3 tiket)")).toHaveText(rp(total));

    const res = await (await api(s)).delete(`/api/orders/${orderId}`);
    expect(res.status()).toBe(200);
    expect((await one(`select usage_count from voucher where id=$1`, [v.id])).usage_count).toBe(0);
  });
});
