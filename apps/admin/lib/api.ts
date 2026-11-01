import http from "node:http";
import https from "node:https";
import { cookies, headers } from "next/headers";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(path: string, status: number, data: unknown) {
    super(`${path}: ${status}`);
    this.status = status;
    this.data = data;
  }
}

type Init = { method?: string; body?: unknown };
type Forward = { cookie: string; host: string; proto?: string | null };

export function callApi<T>(path: string, fwd: Forward, init: Init = {}): Promise<{ status: number; data: T }> {
  const url = new URL(path, process.env.API_INTERNAL_URL);
  const method = init.method ?? "GET";
  const body = init.body === undefined ? undefined : JSON.stringify(init.body);
  const hdrs: Record<string, string> = { "x-forwarded-host": fwd.host, accept: "application/json" };
  if (fwd.cookie) hdrs.cookie = fwd.cookie;
  if (body !== undefined) {
    hdrs["content-type"] = "application/json";
    hdrs["content-length"] = String(Buffer.byteLength(body));
  }
  if (method !== "GET" && method !== "HEAD") hdrs.origin = publicOrigin(fwd);

  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(url, { method, headers: hdrs, timeout: 10_000 }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let data: unknown = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        }
        resolve({ status: res.statusCode ?? 0, data: data as T });
      });
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error(`${method} ${path}: timed out`)));
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

function publicOrigin({ host, proto }: Forward): string {
  const scheme = proto ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${scheme}://${host}`;
}

async function forwarded(): Promise<Forward> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  return {
    cookie: c.toString(),
    host: h.get("host") ?? "",
    proto: h.get("x-forwarded-proto")?.split(",")[0]?.trim() || null,
  };
}

export async function apiRaw<T>(path: string, init: Init = {}): Promise<{ status: number; data: T }> {
  return callApi<T>(path, await forwarded(), init);
}

export async function api<T>(path: string, init: Init = {}): Promise<T> {
  const res = await apiRaw<T>(path, init);
  if (res.status < 200 || res.status >= 300) throw new ApiError(path, res.status, res.data);
  return res.data;
}

export type ApiSession = {
  session: { id: string; userId: string; activeOrganizationId?: string | null };
  user: { id: string; email: string; name: string; image?: string | null; role?: string | null };
} | null;

export function getSession(): Promise<ApiSession> {
  return api<ApiSession>("/api/auth/get-session");
}
