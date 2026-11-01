import { cleanup } from "./lib/db";
import { urls } from "./lib/env";

export default async function globalSetup() {
  for (const [app, url] of Object.entries(urls)) {
    const res = await fetch(`${url}/api/auth/get-session`).catch((e) => {
      throw new Error(`${app} (${url}) is not reachable — is the local stack up? ${e}`);
    });
    if (res.status >= 500) throw new Error(`${app} (${url}) returned ${res.status}`);
  }
  const removed = await cleanup();
  if (Object.keys(removed).length) console.log("e2e: removed leftovers", removed);

}
