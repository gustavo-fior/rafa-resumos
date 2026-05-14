import { env } from "@rafa-resumos/env/db";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const client = postgres(env.DATABASE_URL, {
  ssl: "require",
  prepare: false,
  max: 2,
  idle_timeout: 10,
  max_lifetime: 60 * 30,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export const createDb = () => db;
