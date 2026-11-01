import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "../lib/fixtures";
import { createSession, type Session } from "../lib/auth";
import { createEvent, createOrg, createUser, one, q } from "../lib/db";

type Api = (s: Session | null) => Promise<APIRequestContext>;

async function race(api: Api, buyers: number, eventId: string, ticketTypeId: string) {
  const clients = await Promise.all(
    Array.from({ length: buyers }, async () => api(await createSession((await createUser()).id, "web"))),
  );
  const body = { eventId, items: [{ ticketTypeId, quantity: 1 }], paymentMethod: "qris" };
  const results = await Promise.all(
    clients.map(async (c) => {
      const r = await c.post("/api/orders", { data: body });
      return { status: r.status() as number, body: await r.json() };
    }),
  );
  return { clients, results };
}

test.describe("checkout: last ticket race", () => {
  test("two buyers, one ticket: one 200, one 409 Tiket habis", async ({ api }) => {
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id });
    const ev = await createEvent({ orgId: org.id, tickets: [{ name: "Last One", price: 20_000, quantity: 1 }] });
    const tt = ev.tickets[0]!;

    const { clients, results } = await race(api, 2, ev.id, tt.id);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409]);
    const loser = results.find((r) => r.status === 409)!;
    expect(loser.body).toEqual({ error: "Tiket habis" });
    const winner = results.find((r) => r.status === 200)!;

    expect((await one(`select sold, quantity from ticket_type where id=$1`, [tt.id]))).toEqual({ sold: 1, quantity: 1 });
    const orders = await q(`select id, status from "order" where event_id=$1`, [ev.id]);
    expect(orders).toEqual([{ id: winner.body.orderId, status: "pending_payment" }]);

    const idx = results.indexOf(winner);
    expect((await clients[idx]!.delete(`/api/orders/${winner.body.orderId}`)).status()).toBe(200);
    expect((await one(`select sold from ticket_type where id=$1`, [tt.id])).sold).toBe(0);
  });

  test("burst of 6 buyers for 2 tickets never oversells", async ({ api }) => {
    const owner = await createUser();
    const org = await createOrg({ ownerId: owner.id });
    const ev = await createEvent({ orgId: org.id, tickets: [{ name: "Few", price: 20_000, quantity: 2 }] });
    const tt = ev.tickets[0]!;

    const { clients, results } = await race(api, 6, ev.id, tt.id);
    expect(results.filter((r) => r.status === 200)).toHaveLength(2);
    expect(results.filter((r) => r.status === 409 && r.body.error === "Tiket habis")).toHaveLength(4);
    expect((await one(`select sold from ticket_type where id=$1`, [tt.id])).sold).toBe(2);

    for (const [i, r] of results.entries()) {
      if (r.status === 200) expect((await clients[i]!.delete(`/api/orders/${r.body.orderId}`)).status()).toBe(200);
    }
    expect((await one(`select sold from ticket_type where id=$1`, [tt.id])).sold).toBe(0);
  });
});
