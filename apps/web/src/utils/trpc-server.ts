import "server-only";

import type { AppRouter } from "@rafa-resumos/api/routers/index";
import { env } from "@rafa-resumos/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";

export async function getServerTrpc() {
  const incoming = await headers();
  const cookie = incoming.get("cookie") ?? "";

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
        headers() {
          return cookie ? { cookie } : {};
        },
      }),
    ],
  });
}
