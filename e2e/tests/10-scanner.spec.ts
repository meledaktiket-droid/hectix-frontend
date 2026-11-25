import { test, expect } from "../lib/fixtures";
import { createOrg, createUser, eid, q } from "../lib/db";
import { urls } from "../lib/env";

test.describe("scanner", () => {
  test("unassigned user sees blocked screen with Logout button and no BottomNav", async ({ page, loginAs }) => {
    const stranger = await createUser({ name: "E2E Stranger" });
    await loginAs(stranger.id, "scanner");

    await page.goto(urls.scanner);
    await expect(page.getByText("Akses Scanner Tidak Tersedia")).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout / Ganti Akun" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navigasi Utama Scanner" })).toHaveCount(0);
  });

  test("volunteer can view & redeem E-Ticket from Daftar Tiket and sees scannerName", async ({ page, loginAs }) => {
    const owner = await createUser({ name: "E2E Owner" });
    const volunteer = await createUser({ name: "E2E Petugas Gate" });
    const buyer = await createUser({ name: "E2E Buyer" });
    const org = await createOrg({ ownerId: owner.id, status: "active" });

    const evId = eid("ev");
    const ttId = eid("tt");
    const ordId = eid("ord");
    const oiId = eid("oi");

    await q(
      `insert into event(id, organization_id, name, description, venue_name, address, city, banner_url, categories,
        starts_at, ends_at, status, visibility, attendee_form, created_at, updated_at)
       values($1, $2, 'E2E Scanner Fest', '<p>desc</p>', 'Venue', 'Addr', 'Malang', 'https://x/b.jpg', '["musik"]',
        now() + interval '5 days', now() + interval '6 days', 'published', 'public', false, now(), now())`,
      [evId, org.id],
    );
    await q(
      `insert into ticket_type(id, event_id, name, price, quantity, sold, benefits, display_order, created_at, updated_at)
       values($1, $2, 'Early Bird (Sudah Habis)', 100000, 50, 1, '[]'::jsonb, 0, now(), now())`,
      [ttId, evId],
    );
    await q(
      `insert into "order"(id, user_id, event_id, status, payment_method, subtotal, tax, service_fee, total,
        reference_number, barcode, expires_at, created_at, updated_at)
       values($1, $2, $3, 'paid', 'qris', 100000, 0, 0, 100000, $4, $5, now() + interval '1 day', now(), now())`,
      [ordId, buyer.id, evId, `HX-${ordId}`, `QR-${ordId}`],
    );
    await q(
      `insert into order_item(id, order_id, ticket_type_id, ticket_type_name, price, quantity)
       values($1, $2, $3, 'Early Bird (Sudah Habis)', 100000, 1)`,
      [oiId, ordId, ttId],
    );
    await q(
      `insert into event_crew(id, event_id, email, user_id, role, status, token, invited_by, expires_at, created_at, accepted_at)
       values($1, $2, $3, $4, 'volunteer', 'accepted', $5, $6, now() + interval '7 days', now(), now())`,
      [eid("crew"), evId, volunteer.email, volunteer.id, eid("tok"), owner.id],
    );

    await loginAs(volunteer.id, "scanner");
    await page.goto(urls.scanner);

    // Go to Daftar Tiket (E-Ticket tab is default)
    await page.getByRole("button", { name: "Daftar Tiket" }).click();
    await expect(page.getByText(`HX-${ordId}`)).toBeVisible();
    // Sold-out suffix is stripped cleanly
    await expect(page.getByText("Early Bird", { exact: true })).toBeVisible();

    // Open detail sheet and redeem directly
    await page.getByText(`HX-${ordId}`).click();
    await page.getByRole("button", { name: /Tukar Tiket \/ Akses/ }).click();

    await expect(page.getByText(`Scanner: ${volunteer.name}`)).toBeVisible();
    await expect(page.getByRole("button", { name: /Ganti Tiket/ })).toHaveCount(0);
  });
});
