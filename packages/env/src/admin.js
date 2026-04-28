import "./_load";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
export const env = createEnv({
    clientPrefix: "",
    server: {
        ADMIN_PASSWORD: z.string().min(1),
    },
    client: {},
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
