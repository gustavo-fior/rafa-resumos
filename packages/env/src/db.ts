import "./_load";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "",
  server: {
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
