import { cleanup, pool } from "./lib/db";

export default async function globalTeardown() {
  if (process.env.E2E_KEEP) {
    console.log("e2e: E2E_KEEP set, leaving e2e- rows in place");
  } else {
    console.log("e2e: cleanup", await cleanup());
  }
  await pool.end();
}
