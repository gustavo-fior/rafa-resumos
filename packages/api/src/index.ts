import { initTRPC, TRPCError } from "@trpc/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { env as adminEnv } from "@rafa-resumos/env/admin";
import { env as authEnv } from "@rafa-resumos/env/auth";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

function expectedAdminToken() {
  return createHmac("sha256", authEnv.BETTER_AUTH_SECRET)
    .update(`admin:${adminEnv.ADMIN_PASSWORD}`)
    .digest("hex");
}

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const token = ctx.adminToken;
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin token missing" });
  }
  const expected = expectedAdminToken();
  if (token.length !== expected.length) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin token" });
  }
  const ok = timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  if (!ok) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin token" });
  }
  return next({ ctx });
});
