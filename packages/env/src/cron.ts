import "./_load";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "",
  server: {
    CRON_SECRET: z.string().min(16),
  },
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
