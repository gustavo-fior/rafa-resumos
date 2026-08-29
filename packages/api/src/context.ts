import { auth } from "@rafa-resumos/auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  // Skip the session lookup (a DB round-trip) for anonymous requests: without
  // a cookie header there is nothing to resolve.
  const session = context.req.header("cookie")
    ? await auth.api.getSession({ headers: context.req.raw.headers })
    : null;
  return {
    auth: null,
    adminToken: context.req.header("x-admin-token") ?? null,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
