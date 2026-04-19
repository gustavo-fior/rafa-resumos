import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const ABACATEPAY_WEBHOOK_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

const currentDir = dirname(fileURLToPath(import.meta.url));

for (const envPath of [
  resolve(currentDir, "../../../apps/server/.env"),
  resolve(process.cwd(), "apps/server/.env"),
  resolve(process.cwd(), ".env"),
]) {
  dotenv.config({ path: envPath, override: false });
}

export const env = createEnv({
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
    ABACATEPAY_WEBHOOK_PUBLIC_KEY: z
      .string()
      .min(1)
      .default(ABACATEPAY_WEBHOOK_PUBLIC_KEY),
    ADMIN_PASSWORD: z.string().min(1).default("teamomeuuega"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
