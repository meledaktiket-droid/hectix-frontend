import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";
import { apiClient, createSession, signIn, type Session } from "./auth";
import type { App } from "./env";

type Fixtures = {
  loginAs: (userId: string, app: App, opts?: { activeOrganizationId?: string }) => Promise<Session>;
  api: (s: Session | null, app?: App) => Promise<APIRequestContext>;
};

export const test = base.extend<Fixtures>({
  loginAs: async ({ context }, use) => {
    await use(async (userId, app, opts) => {
      const s = await createSession(userId, app, opts);
      await signIn(context, s);
      return s;
    });
  },
  api: async ({}, use) => {
    const made: APIRequestContext[] = [];
    await use(async (s, app) => {
      const c = await apiClient(s, app);
      made.push(c);
      return c;
    });
    await Promise.all(made.map((c) => c.dispose()));
  },
});

export { expect };

export function rp(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

export function collectDialogs(page: Page): string[] {
  const msgs: string[] = [];
  page.on("dialog", (d) => {
    msgs.push(d.message());
    void d.accept();
  });
  return msgs;
}
