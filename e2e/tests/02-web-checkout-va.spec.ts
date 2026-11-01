import { test, expect, rp, collectDialogs } from "../lib/fixtures";
import { createEvent, createOrg, createUser, one, poll, q, resendUser, settings } from "../lib/db";
import { urls } from "../lib/env";
import { payVaInSimulator, postSignedSettlement } from "../lib/midtrans";

const BANK = { id: "bni", label: "Bank Negara Indonesia" };

test.describe("web: checkout via VA, paid through the Midtrans sandbox", () => {
  test("buy 2 tickets → VA → simulator pay → webhook → tickets + e-ticket → histori + PDF", async ({ page, browser, loginAs }) => {
    test.setTimeout(420_000);
    const dialogs = collectDialogs(page);
    const buyer = await resendUser();
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id });
    const price = 50_000;
    const ev = await createEvent({ orgId: org.id, tickets: [{ name: "Reguler", price, quantity: 20 }] });
    const tt = ev.tickets[0]!;
    const st = await settings();

    await loginAs(buyer.id, "web");

    await page.goto(urls.web + `/events/${ev.id}`);
    const row = page.locator("div.space-y-2").filter({ has: page.getByText("Reguler", { exact: true }) }).last();
    const plus = row.locator("button").last();
    await plus.click();
    await plus.click();
    await page.getByRole("button", { name: "Beli 2 Tiket" }).click();

    await expect(page).toHaveURL(new RegExp(`/events/${ev.id}/checkout\\?tickets=${tt.id}:2`));
    await expect(page.getByText(buyer.email).first()).toBeVisible();
    await page.locator("label", { hasText: BANK.label }).locator('input[type="radio"]').check();
    await page.getByRole("checkbox").check();

    const subtotal = price * 2;
    const tax = Math.round((subtotal * st.taxPercent) / 100);
    const total = subtotal + tax + Math.round(st.serviceFee);
    await expect(page.getByText(rp(total)).first()).toBeVisible();

    await page.getByRole("button", { name: "Bayar Sekarang" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}\/pay$/, { timeout: 60_000 });
    const orderId = page.url().match(/orders\/([0-9a-f-]{36})\/pay/)![1]!;
    expect(dialogs, "no error alert during checkout").toEqual([]);

    const order = await one(`select * from "order" where id=$1`, [orderId]);
    expect(order).toMatchObject({
      user_id: buyer.id, event_id: ev.id, status: "pending_payment", payment_method: "va_bank", bank: BANK.id,
      subtotal, tax, service_fee: st.serviceFee, total, voucher_discount: 0,
    });
    expect(order.va_number).toMatch(/^\d{8,}$/);
    expect((await one(`select sold from ticket_type where id=$1`, [tt.id])).sold).toBe(2);

    await expect(page.getByText(order.va_number, { exact: true })).toBeVisible();
    await expect(page.getByText(rp(total)).first()).toBeVisible();

    let via = "midtrans-simulator";
    try {
      const result = await payVaInSimulator(browser, BANK.id, order.va_number, total);
      test.info().annotations.push({ type: "simulator-result", description: result });
    } catch (e) {
      via = "signed-notification-fallback";
      test.info().annotations.push({ type: "simulator-error", description: String(e) });
      expect(await postSignedSettlement(orderId, total)).toBe(200);
    }
    test.info().annotations.push({ type: "payment", description: via });
    console.log(`[va] payment via ${via}`);

    const paid = await poll(
      async () => (await q(`select status, reference_number from "order" where id=$1 and status='paid'`, [orderId]))[0],
      { timeout: 180_000, interval: 2_000, what: "order paid (Midtrans webhook)" },
    );
    expect(paid.reference_number).toMatch(/^HX-\d{4}-\d{4}-\d{4}$/);
    const tickets = await q(`select * from ticket where order_id=$1`, [orderId]);
    expect(tickets).toHaveLength(2);
    for (const t of tickets) expect(t).toMatchObject({ status: "valid", event_id: ev.id, ticket_type_id: tt.id, attendee_name: buyer.name });
    expect((await one(`select sold from ticket_type where id=$1`, [tt.id])).sold).toBe(2);

    const statusJob = await one(`select status from job where kind='order.status' and payload->>'orderId'=$1 order by id desc limit 1`, [orderId]);
    expect(statusJob.status).toBe("done");
    const sent = await poll(
      async () => (await q(`select o.eticket_sent_at, j.status, j.last_error from "order" o
          join job j on j.kind='eticket.send' and j.payload->>'orderId'=o.id
          where o.id=$1 and j.status in ('done','failed')`, [orderId]))[0],
      { timeout: 180_000, interval: 2_000, what: "eticket.send job to finish" },
    );
    expect(sent.last_error ?? null, "eticket.send error").toBeNull();
    expect(sent.status).toBe("done");
    expect(sent.eticket_sent_at).toBeTruthy();
    console.log(`[va] eticket.send done, eticket_sent_at=${sent.eticket_sent_at.toISOString()} to ${buyer.email}`);
    test.info().annotations.push({ type: "eticket", description: `job done, eticket_sent_at=${sent.eticket_sent_at.toISOString()}` });

    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}/success`), { timeout: 30_000 });

    await page.goto(urls.web + "/histori");
    const card = page.locator(`a[href="/histori/${orderId}"]`).first();
    await expect(card).toBeVisible();
    await expect(page.getByText(ev.name).first()).toBeVisible();
    await expect(page.getByText(paid.reference_number).first()).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/histori/${orderId}`));
    const print = page.getByRole("link", { name: "Cetak Tiket" });
    await expect(print).toHaveAttribute("href", `/api/histori/${orderId}/ticket.pdf`);

    const pdf = await page.request.get(urls.web + `/api/histori/${orderId}/ticket.pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
