import pg from "pg";
import { randomBytes, randomUUID } from "node:crypto";
import { env } from "./env";

const url = new URL(env.databaseUrl);
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
  throw new Error(`e2e refuses to run against non-local database host ${url.hostname}`);
}

pg.types.setTypeParser(1114, (s: string) => new Date(s.replace(" ", "T") + "Z"));

export const pool = new pg.Pool({ connectionString: env.databaseUrl, max: 4, options: "-c timezone=UTC" });

export async function q<T = Record<string, any>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool.query(sql, params);
  return r.rows as T[];
}

export async function one<T = Record<string, any>>(sql: string, params: unknown[] = []): Promise<T> {
  const rows = await q<T>(sql, params);
  if (rows.length !== 1) throw new Error(`expected 1 row, got ${rows.length}: ${sql}`);
  return rows[0]!;
}

export async function poll<T>(fn: () => Promise<T>, { timeout = 60_000, interval = 1_000, what = "condition" } = {}): Promise<NonNullable<T>> {
  const end = Date.now() + timeout;
  let last: T | undefined;
  while (Date.now() < end) {
    last = await fn();
    if (last) return last as NonNullable<T>;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`timed out after ${timeout}ms waiting for ${what} (last: ${JSON.stringify(last)})`);
}

export const PREFIX = "e2e-";

export function rid(n = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const b = randomBytes(n);
  return Array.from(b, (x) => alphabet[x % alphabet.length]).join("");
}

export function eid(kind: string): string {
  return `${PREFIX}${kind}-${rid(10)}`;
}

export { randomUUID };

export type User = { id: string; email: string; name: string; role: string };

export async function createUser(opts: { email?: string; name?: string; role?: string; id?: string } = {}): Promise<User> {
  const id = opts.id ?? eid("user");
  const email = opts.email ?? `${id}@example.com`;
  const name = opts.name ?? `E2E ${id.slice(-6)}`;
  const role = opts.role ?? "user";
  await q(
    `insert into "user"(id,name,email,email_verified,role,created_at,updated_at) values($1,$2,$3,true,$4,now(),now())`,
    [id, name, email, role],
  );
  return { id, email, name, role };
}

export const RESEND_SINK = "delivered@resend.dev";
export async function resendUser(): Promise<User> {
  const id = "e2e-user-resend";
  const existing = await q<User>(`select id,email,name,role from "user" where email=$1`, [RESEND_SINK]);
  if (existing[0]) {
    if (!existing[0].id.startsWith(PREFIX)) throw new Error(`${RESEND_SINK} belongs to a non-e2e user; refusing to use it`);
    return existing[0];
  }
  return createUser({ id, email: RESEND_SINK, name: "E2E Resend Buyer" });
}

export type Org = { id: string; name: string; slug: string };

export async function createOrg(opts: { ownerId: string; status?: string; name?: string; members?: { userId: string; role: string }[] }): Promise<Org> {
  const id = eid("org");
  const name = opts.name ?? `E2E Org ${id.slice(-6)}`;
  const slug = id;
  await q(`insert into organization(id,name,slug,created_at,status) values($1,$2,$3,now(),$4)`, [id, name, slug, opts.status ?? "active"]);
  await q(`insert into member(id,organization_id,user_id,role,created_at) values($1,$2,$3,'owner',now())`, [eid("mem"), id, opts.ownerId]);
  for (const m of opts.members ?? []) {
    await q(`insert into member(id,organization_id,user_id,role,created_at) values($1,$2,$3,$4,now())`, [eid("mem"), id, m.userId, m.role]);
  }
  return { id, name, slug };
}

export type TicketType = { id: string; name: string; price: number; quantity: number };
export type Event = { id: string; name: string; tickets: TicketType[] };

export async function createEvent(opts: {
  orgId: string;
  name?: string;
  status?: string;
  visibility?: string;
  daysAhead?: number;
  tickets?: { name: string; price: number; quantity: number }[];
  bannerUrl?: string | null;
}): Promise<Event> {
  const id = eid("event");
  const name = opts.name ?? `E2E Event ${rid(6)}`;
  const days = opts.daysAhead ?? 30;
  await q(
    `insert into event(id,organization_id,name,description,venue_name,address,city,banner_url,starts_at,ends_at,status,visibility,categories,created_at,updated_at)
     values($1,$2,$3,'<p>Automated e2e fixture</p>','E2E Hall','Jl. Testing No. 1','Jakarta',$4,
            now() + make_interval(days => $5::int), now() + make_interval(days => $5::int, hours => 4),$6,$7,'["musik"]'::jsonb,now(),now())`,
    [id, opts.orgId, name, opts.bannerUrl ?? null, days, opts.status ?? "published", opts.visibility ?? "public"],
  );
  const tickets: TicketType[] = [];
  let order = 0;
  for (const t of opts.tickets ?? [{ name: "Regular", price: 100_000, quantity: 100 }]) {
    const tid = eid("tt");
    await q(
      `insert into ticket_type(id,event_id,name,price,quantity,sold,display_order,created_at,updated_at) values($1,$2,$3,$4,$5,0,$6,now(),now())`,
      [tid, id, t.name, t.price, t.quantity, order++],
    );
    tickets.push({ id: tid, ...t });
  }
  return { id, name, tickets };
}

export async function createVoucher(opts: { eventId: string; code?: string; type?: "percent" | "fixed"; amount: number; usageLimit?: number | null }) {
  const id = eid("voucher");
  const code = (opts.code ?? `E2E${rid(6)}`).toUpperCase();
  await q(
    `insert into voucher(id,event_id,code,type,amount,usage_limit,usage_count,created_at) values($1,$2,$3,$4,$5,$6,0,now())`,
    [id, opts.eventId, code, opts.type ?? "percent", opts.amount, opts.usageLimit ?? null],
  );
  return { id, code };
}

export async function settings(): Promise<{ serviceFee: number; taxPercent: number }> {
  const rows = await q<{ key: string; value: string }>(`select key, value from site_setting where key in ('service_fee','tax_percent')`);
  const m = Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));
  return { serviceFee: m.service_fee ?? 0, taxPercent: m.tax_percent ?? 0 };
}

export async function cleanup(): Promise<Record<string, number>> {
  const c = await pool.connect();
  const counts: Record<string, number> = {};
  const run = async (label: string, sql: string) => {
    const r = await c.query(sql);
    if (r.rowCount) counts[label] = (counts[label] ?? 0) + r.rowCount;
  };
  try {
    await c.query("begin");
    await c.query(`create temp table e2e_users on commit drop as select id from "user" where id like 'e2e-%'`);
    await c.query(`create temp table e2e_orgs on commit drop as select id from organization where id like 'e2e-%'`);
    await c.query(`create temp table e2e_events on commit drop as
      select id from event where id like 'e2e-%' or organization_id in (select id from e2e_orgs)`);
    await c.query(`create temp table e2e_orders on commit drop as
      select id from "order" where user_id in (select id from e2e_users) or event_id in (select id from e2e_events)`);
    await run("job", `delete from job where payload->>'orderId' in (select id from e2e_orders)`);
    await run("ticket", `delete from ticket where order_id in (select id from e2e_orders) or event_id in (select id from e2e_events)`);
    await run("order_item", `delete from order_item where order_id in (select id from e2e_orders)`);
    await run("order", `delete from "order" where id in (select id from e2e_orders)`);
    await run("voucher", `delete from voucher where event_id in (select id from e2e_events)`);
    await run("ticket_type", `delete from ticket_type where event_id in (select id from e2e_events)`);
    await run("performer", `delete from performer where event_id in (select id from e2e_events)`);
    await run("wall_comment", `delete from wall_comment where event_id in (select id from e2e_events) or user_id in (select id from e2e_users)`);
    await run("favorite", `delete from favorite where event_id in (select id from e2e_events) or user_id in (select id from e2e_users)`);
    await run("event", `delete from event where id in (select id from e2e_events)`);
    await run("invitation", `delete from invitation where organization_id in (select id from e2e_orgs) or inviter_id in (select id from e2e_users)`);
    await run("admin_invitation", `delete from admin_invitation where invited_by in (select id from e2e_users)`);
    await run("member", `delete from member where organization_id in (select id from e2e_orgs) or user_id in (select id from e2e_users)`);
    await run("organization_status_history", `delete from organization_status_history where organization_id in (select id from e2e_orgs)`);
    await run("payout_request", `delete from payout_request where organization_id in (select id from e2e_orgs)`);
    await run("organization", `delete from organization where id in (select id from e2e_orgs)`);
    await run("session", `delete from session where user_id in (select id from e2e_users) or id like 'e2e-%'`);
    await run("account", `delete from account where user_id in (select id from e2e_users)`);
    await run("user", `delete from "user" where id in (select id from e2e_users)`);
    await c.query("commit");
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
  return counts;
}

export async function createPayoutRequest(orgId: string, amount = 250_000) {
  const id = eid("payout");
  await q(
    `insert into payout_request(id,organization_id,amount,bank_name,account_number,account_holder_name,status,created_at,platform_fee)
     values($1,$2,$3,'BCA','1234567890','E2E Holder','pending',now(),7000)`,
    [id, orgId, amount],
  );
  return { id, amount };
}
