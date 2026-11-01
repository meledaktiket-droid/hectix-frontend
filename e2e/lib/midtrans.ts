import { createHash } from "node:crypto";
import type { Browser, Page } from "@playwright/test";
import { env, urls } from "./env";

const SIMULATOR = "https://simulator.sandbox.midtrans.com";

const VA_PAGES: Record<string, string> = {
  bca: `${SIMULATOR}/bca/va/index`,
  bni: `${SIMULATOR}/bni/va/index`,
  bri: `${SIMULATOR}/openapi/va/index?bank=bri`,
  mandiri: `${SIMULATOR}/openapi/va/index?bank=mandiri`,
  bsi: `${SIMULATOR}/openapi/va/index?bank=bsi`,
};

export async function payVaInSimulator(browser: Browser, bank: string, vaNumber: string, expectedAmount: number): Promise<string> {
  const page_ = VA_PAGES[bank];
  if (!page_) throw new Error(`no simulator page for bank ${bank}`);
  const ctx = await browser.newContext();
  const page: Page = await ctx.newPage();
  try {
    await page.goto(page_);
    await page.locator('input[name="va_number"]').fill(vaNumber);
    await page.locator('input[type="submit"][value="Inquire"]').click();
    await page.waitForURL(/inquiry/);
    const amount = await page.locator('input[name="total_amount"]').inputValue();
    if (Number(amount) !== expectedAmount) {
      throw new Error(`simulator inquiry amount ${amount} != expected ${expectedAmount}`);
    }
    await page.locator('input[type="submit"][value="Pay"]').click();
    await page.waitForLoadState("domcontentloaded");
    return (await page.locator("body").innerText()).replace(/\s+/g, " ").trim().slice(0, 300);
  } finally {
    await ctx.close();
  }
}

export function signature(orderId: string, statusCode: string, grossAmount: string): string {
  return createHash("sha512").update(orderId + statusCode + grossAmount + env.midtransServerKey).digest("hex");
}

export async function postSignedSettlement(orderId: string, total: number): Promise<number> {
  const gross = `${total}.00`;
  const res = await fetch(`${urls.web}/api/midtrans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      status_code: "200",
      gross_amount: gross,
      transaction_status: "settlement",
      fraud_status: "accept",
      signature_key: signature(orderId, "200", gross),
    }),
  });
  return res.status;
}
