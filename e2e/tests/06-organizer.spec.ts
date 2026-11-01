import { test, expect } from "../lib/fixtures";
import { createSession } from "../lib/auth";
import { createEvent, createOrg, createUser, one, q, rid } from "../lib/db";
import { fillEventForm, type EventInput } from "../lib/organizer";

function eventInput(): EventInput {
  const startsAt = new Date(Date.now() + 60 * 86400_000);
  startsAt.setUTCSeconds(0, 0);
  startsAt.setUTCMinutes(0);
  return {
    name: `E2E Organizer Fest ${rid(6)}`,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 5 * 3600_000),
    venue: "E2E Arena",
    address: "Jl. Asia Afrika No. 8",
    city: "Bandung",
    category: "Musik",
    ticket: { name: "Early Bird", price: 85_000, quantity: 150 },
  };
}

test.describe("organizer: events", () => {
  test("active org owner creates, adds a ticket type and publishes via the UI", async ({ page, loginAs }) => {
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id, status: "active" });
    await loginAs(owner.id, "organizer", { activeOrganizationId: org.id });

    const input = eventInput();
    await fillEventForm(page, input);
    const publish = page.waitForResponse((r) => /\/api\/events\/[^/]+\/publish$/.test(r.url()));
    await page.getByRole("button", { name: "Publish" }).click();
    expect((await publish).status()).toBe(200);
    await expect(page).toHaveURL(/\/events\/[^/]+\/edit$/);
    const eventId = page.url().match(/events\/([^/]+)\/edit/)![1]!;

    const ev = await one(`select * from event where id=$1`, [eventId]);
    expect(ev).toMatchObject({
      organization_id: org.id, name: input.name, status: "published", visibility: "public",
      venue_name: input.venue, address: input.address, city: input.city, categories: ["musik"], deleted_at: null,
    });
    expect(ev.starts_at.toISOString()).toBe(input.startsAt.toISOString());
    expect(ev.ends_at.toISOString()).toBe(input.endsAt.toISOString());
    const tts = await q(`select name, price, quantity, sold from ticket_type where event_id=$1`, [eventId]);
    expect(tts).toEqual([{ name: input.ticket.name, price: input.ticket.price, quantity: input.ticket.quantity, sold: 0 }]);

    await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible();
    const pub = await page.request.get(`http://localhost:3000/api/events/${eventId}`);
    expect(pub.status()).toBe(200);
    expect((await pub.json()).name).toBe(input.name);
  });

  test("non-active org cannot publish: 403 Organisasi belum terverifikasi", async ({ page, loginAs }) => {
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id, status: "pending" });
    await loginAs(owner.id, "organizer", { activeOrganizationId: org.id });

    const input = eventInput();
    await fillEventForm(page, input);
    const publish = page.waitForResponse((r) => /\/api\/events\/[^/]+\/publish$/.test(r.url()));
    await page.getByRole("button", { name: "Publish" }).click();
    const res = await publish;
    expect(res.status()).toBe(403);
    expect(await res.json()).toEqual({ error: "Organisasi belum terverifikasi" });

    const evs = await q(`select id, status from event where organization_id=$1`, [org.id]);
    expect(evs).toHaveLength(1);
    expect(evs[0]!.status).toBe("draft");
    expect(await q(`select 1 from ticket_type where event_id=$1`, [evs[0]!.id])).toHaveLength(1);
    await expect(page).toHaveURL(/\/events\/create$/);
  });

  test("a plain member cannot publish (403 Forbidden)", async ({ api }) => {
    const owner = await createUser();
    const member = await createUser();
    const org = await createOrg({ ownerId: owner.id, status: "active", members: [{ userId: member.id, role: "member" }] });
    const ev = await createEvent({ orgId: org.id, status: "draft" });

    const asMember = await api(await createSession(member.id, "organizer", { activeOrganizationId: org.id }));
    const res = await asMember.post(`/api/events/${ev.id}/publish`);
    expect(res.status()).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
    expect((await one(`select status from event where id=$1`, [ev.id])).status).toBe("draft");

    expect((await asMember.get(`/api/events/${ev.id}`)).status()).toBe(200);

    const asOwner = await api(await createSession(owner.id, "organizer", { activeOrganizationId: org.id }));
    expect((await asOwner.post(`/api/events/${ev.id}/publish`)).status()).toBe(200);
    expect((await one(`select status from event where id=$1`, [ev.id])).status).toBe("published");
  });
});
