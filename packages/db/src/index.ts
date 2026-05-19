import { env } from "@rafa-resumos/env/db";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const client = postgres(env.DATABASE_URL, {
  ssl: "require",
  // Supavisor transaction mode (port 6543) still can't do prepared statements.
  prepare: false,
  // Safe now: one persistent Fly process => one bounded pool, no serverless fan-out.
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export const createDb = () => db;
