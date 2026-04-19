import "./_load";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "",
  server: {
    ABACATEPAY_API_KEY: z.string().min(1),
    ABACATEPAY_WEBHOOK_SECRET: z.string().min(1),
    ABACATEPAY_WEBHOOK_PUBLIC_KEY: z.string().min(1),
  },
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
