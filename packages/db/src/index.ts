import { env } from "@rafa-resumos/env/db";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const client = postgres(env.DATABASE_URL, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export const createDb = () => db;
