import { readFileSync } from "node:fs";

const DEFAULT_API_ENV = new URL("../../backend/.env.local", import.meta.url).pathname;

function fromScript(): Record<string, string> {
  const path = process.env.E2E_API_ENV ?? DEFAULT_API_ENV;
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    out[m[1]!] = m[2]!.trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

let cache: Record<string, string> | undefined;

function get(name: string, required = true): string {
  cache ??= fromScript();
  const v = process.env[name] ?? cache[name];
  if (!v && required) {
    throw new Error(`${name} is not set (export it, or fill backend/.env.local)`);
  }
  return v ?? "";
}

export const env = {
  get authSecret() {
    return get("AUTH_SECRET");
  },
  get midtransServerKey() {
    return get("MIDTRANS_SERVER_KEY");
  },
  get uploadDir() {
    return get("UPLOAD_DIR", false);
  },
  get databaseUrl() {
    return process.env.E2E_DATABASE_URL ?? "postgres://hectix:hectix@localhost:5432/hectix_dev";
  },
};

export const urls = {
  web: process.env.E2E_WEB_URL ?? "http://localhost:3000",
  organizer: process.env.E2E_ORGANIZER_URL ?? "http://localhost:3001",
  admin: process.env.E2E_ADMIN_URL ?? "http://localhost:3002",
};

export type App = keyof typeof urls;
