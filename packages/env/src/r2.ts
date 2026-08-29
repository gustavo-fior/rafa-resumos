import "./_load";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "",
  server: {
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET: z.string().min(1),
    // Public base URL of the bucket (r2.dev subdomain or a custom domain), no trailing slash.
    R2_PUBLIC_URL: z.string().url(),
  },
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
