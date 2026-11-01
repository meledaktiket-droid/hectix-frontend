import { createHmac } from "node:crypto";
import { request as pwRequest, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { eid, q, rid } from "./db";
import { env, urls, type App } from "./env";

export type Session = { id: string; token: string; cookieName: string; cookieValue: string; app: App; userId: string };

export function signToken(token: string): string {
  const mac = createHmac("sha256", env.authSecret).update(token).digest("base64");
  return encodeURIComponent(`${token}.${mac}`);
}

export async function createSession(userId: string, app: App, opts: { activeOrganizationId?: string } = {}): Promise<Session> {
  const id = eid("sess");
  const token = rid(32);
  await q(
    `insert into session(id,token,user_id,expires_at,created_at,updated_at,active_organization_id,user_agent)
     values($1,$2,$3,now() + interval '7 days',now(),now(),$4,'playwright-e2e')`,
    [id, token, userId, opts.activeOrganizationId ?? null],
  );
  return { id, token, app, userId, cookieName: `${app}.session_token`, cookieValue: signToken(token) };
}

export async function signIn(context: BrowserContext, s: Session) {
  await context.addCookies([
    { name: s.cookieName, value: s.cookieValue, url: urls[s.app], httpOnly: true, sameSite: "Lax" },
  ]);
}

export async function apiClient(s: Session | null, app: App = s?.app ?? "web"): Promise<APIRequestContext> {
  const headers: Record<string, string> = { Origin: urls[app] };
  if (s) headers.Cookie = `${s.cookieName}=${s.cookieValue}`;
  return pwRequest.newContext({ baseURL: urls[app], extraHTTPHeaders: headers });
}
