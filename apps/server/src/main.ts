import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@rafa-resumos/api/context";
import { appRouter } from "@rafa-resumos/api/routers/index";
import {
  type AbacatepayTransparentWebhookPayload,
  verifyAbacatepayWebhookSignature,
} from "@rafa-resumos/api/services/abacatepay";
import { syncNotionProducts } from "@rafa-resumos/api/services/notion-sync";
import { processAbacatepayWebhook } from "@rafa-resumos/api/services/purchase";
import { auth } from "@rafa-resumos/auth";
import { env as abacatepayEnv } from "@rafa-resumos/env/abacatepay";
import { env as authEnv } from "@rafa-resumos/env/auth";
import { env as cronEnv } from "@rafa-resumos/env/cron";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { stream } from "hono/streaming";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: authEnv.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

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

  let payload: AbacatepayTransparentWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as AbacatepayTransparentWebhookPayload;
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  if (!payload?.id || !payload?.event || !payload?.data?.transparent?.id) {
    return c.json({ error: "Malformed webhook payload" }, 400);
  }

  await processAbacatepayWebhook(payload, rawBody);

  return c.json({ received: true });
});

// Called by the scheduled GitHub Actions workflow (.github/workflows/sync-notion.yml).
// A full sync can take minutes (it copies Notion images to R2). The machine is
// scale-to-zero, so the request must stay open for the whole run — Fly only
// keeps a machine alive while it has in-flight requests — hence the heartbeat.
let notionSyncInFlight: Promise<void> | null = null;

app.post("/internal/sync-notion", (c) => {
  const authorization = c.req.header("Authorization") ?? "";

  if (authorization !== `Bearer ${cronEnv.CRON_SECRET}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const startedAt = Date.now();
  // A concurrent call joins the running sync instead of starting another.
  const run =
    notionSyncInFlight ??
    (notionSyncInFlight = syncNotionProducts().finally(() => {
      notionSyncInFlight = null;
    }));

  return stream(c, async (body) => {
    const heartbeat = setInterval(() => {
      body.write(".").catch(() => undefined);
    }, 5_000);

    try {
      await run;
      await body.write(
        `\n${JSON.stringify({ ok: true, durationMs: Date.now() - startedAt })}\n`
      );
    } catch (error) {
      console.error("[sync-notion] failed", error);
      await body.write(`\n${JSON.stringify({ ok: false, error: "Sync failed" })}\n`);
    } finally {
      clearInterval(heartbeat);
    }
  });
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  })
);

app.get("/", (c) => {
  return c.text("OK");
});

export { app };

// Bind explicitly to 0.0.0.0 so Fly's proxy (and any container runtime)
// can reach it — Bun's implicit default-export server binds to localhost.
export default {
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: Number(process.env.PORT) || 3000,
  // Bun defaults to 10s, which cuts off long requests like the Notion sync.
  idleTimeout: 120,
};
