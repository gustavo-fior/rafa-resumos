import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@rafa-resumos/api/context";
import { appRouter } from "@rafa-resumos/api/routers/index";
import { verifyAbacatepayWebhookSignature, } from "@rafa-resumos/api/services/abacatepay";
import { processAbacatepayWebhook } from "@rafa-resumos/api/services/purchase";
import { auth } from "@rafa-resumos/auth";
import { env as abacatepayEnv } from "@rafa-resumos/env/abacatepay";
import { env as authEnv } from "@rafa-resumos/env/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
const app = new Hono();
app.use(logger());
app.use("/*", cors({
    origin: authEnv.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.post("/webhooks/abacatepay", async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header("X-Webhook-Signature") ?? "";
    const webhookSecret = c.req.query("webhookSecret");
    if (webhookSecret && webhookSecret !== abacatepayEnv.ABACATEPAY_WEBHOOK_SECRET) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    if (!verifyAbacatepayWebhookSignature(rawBody, signature)) {
        return c.json({ error: "Invalid signature" }, 401);
    }
    let payload;
    try {
        payload = JSON.parse(rawBody);
    }
    catch {
        return c.json({ error: "Invalid JSON payload" }, 400);
    }
    if (!payload?.id || !payload?.event || !payload?.data?.transparent?.id) {
        return c.json({ error: "Malformed webhook payload" }, 400);
    }
    await processAbacatepayWebhook(payload, rawBody);
    return c.json({ received: true });
});
app.use("/trpc/*", trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
        return createContext({ context });
    },
}));
app.get("/", (c) => {
    return c.text("OK");
});
export default app;
