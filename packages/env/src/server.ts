import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));

for (const envPath of [
  resolve(currentDir, "../../../apps/server/.env"),
  resolve(process.cwd(), "apps/server/.env"),
  resolve(process.cwd(), ".env"),
]) {
  dotenv.config({ path: envPath, override: false });
}

export const env = createEnv({
  clientPrefix: "",
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    NOTION_API_KEY: z.string().min(1),
    NOTION_DATABASE_ID: z.string().min(1),
    ABACATEPAY_API_KEY: z.string().min(1),
    ABACATEPAY_WEBHOOK_SECRET: z.string().min(1),
    ABACATEPAY_WEBHOOK_PUBLIC_KEY: z.string().min(1),
    ADMIN_PASSWORD: z.string().min(1),
  },
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
