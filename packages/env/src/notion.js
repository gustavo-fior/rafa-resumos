import "./_load";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
export const env = createEnv({
    clientPrefix: "",
    server: {
        NOTION_API_KEY: z.string().min(1),
        NOTION_DATABASE_ID: z.string().min(1),
    },
    client: {},
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
