import "server-only";

import type { AppRouter } from "@rafa-resumos/api/routers/index";
import { env } from "@rafa-resumos/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { cookies, headers } from "next/headers";

import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function getServerTrpc() {
  const incoming = await headers();
  const cookie = incoming.get("cookie") ?? "";
  const adminToken = (await cookies()).get(ADMIN_COOKIE)?.value;

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
        headers() {
          const h: Record<string, string> = {};
          if (cookie) h.cookie = cookie;
          if (adminToken) h["x-admin-token"] = adminToken;
          return h;
        },
      }),
    ],
  });
}
