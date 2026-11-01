import { expect, type Page } from "@playwright/test";
import { urls } from "./env";

export function jakartaLocal(d: Date): string {
  return new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 16);
}

export type EventInput = {
  name: string;
  startsAt: Date;
  endsAt: Date;
  venue: string;
  address: string;
  city: string;
  category: string;
  ticket: { name: string; price: number; quantity: number };
};

export async function fillEventForm(page: Page, ev: EventInput) {
  await page.goto(urls.organizer + "/events/create");
  await expect(page.getByRole("heading", { name: "Create New Event" })).toBeVisible();
  await page.getByPlaceholder("e.g. Loud Fest 2025").fill(ev.name);
  const dates = page.locator('input[type="datetime-local"]');
  await dates.nth(0).fill(jakartaLocal(ev.startsAt));
  await dates.nth(1).fill(jakartaLocal(ev.endsAt));
  await page.getByPlaceholder("e.g. Gelora Bung Karno").fill(ev.venue);
  await page.getByPlaceholder("Street address").fill(ev.address);
  await page.locator("select").selectOption(ev.city);
  await page.getByRole("button", { name: "Pilih kategori" }).click();
  await page.getByRole("menuitemcheckbox", { name: ev.category }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText("1 kategori dipilih")).toBeVisible();

  await page.getByRole("button", { name: /^Tickets/ }).click();
  await page.getByRole("button", { name: "Add Ticket Type" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("e.g. Early Bird, Presale 1, VIP").fill(ev.ticket.name);
  await dialog.getByPlaceholder("0").fill(String(ev.ticket.price));
  await dialog.locator('input[type="number"]').fill(String(ev.ticket.quantity));
  await dialog.getByRole("button", { name: "Add ticket" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(ev.ticket.name, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tickets (1)" })).toBeVisible();
}
