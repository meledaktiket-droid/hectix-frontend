import { expect, type Page } from "@playwright/test";
import { urls } from "./env";

export async function pickTickets(page: Page, eventId: string, tierName: string, qty: number) {
  await page.goto(urls.web + `/events/${eventId}`);
  const row = page.locator("div.space-y-2").filter({ has: page.getByText(tierName, { exact: true }) }).last();
  const plus = row.locator("button").last();
  for (let i = 0; i < qty; i++) await plus.click();
  await page.getByRole("button", { name: `Beli ${qty} Tiket` }).click();
  await expect(page).toHaveURL(new RegExp(`/events/${eventId}/checkout\\?tickets=`));
}

export async function choosePayment(page: Page, method: { bank: string } | "qris") {
  if (method === "qris") {
    await page.locator("label", { hasText: "QRIS Barcode GPN" }).locator('input[type="radio"]').check();
  } else {
    await page.locator("label", { hasText: method.bank }).locator('input[type="radio"]').check();
  }
}

export async function redeemVoucher(page: Page, code: string) {
  await page.getByPlaceholder("Masukan kode").fill(code);
  await page.getByRole("button", { name: "Redeem" }).click();
}

export async function submitCheckout(page: Page): Promise<string> {
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Bayar Sekarang" }).click();
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}\/pay$/, { timeout: 60_000 });
  return page.url().match(/orders\/([0-9a-f-]{36})\/pay/)![1]!;
}

export function summaryValue(page: Page, label: string) {
  return page.locator("div.flex.justify-between").filter({ has: page.getByText(label, { exact: true }) }).locator("> :last-child");
}
