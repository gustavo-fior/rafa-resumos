import { createDb } from "@rafa-resumos/db";
import * as schema from "@rafa-resumos/db/schema/auth";
import { env } from "@rafa-resumos/env/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

function getSharedCookieDomain(appUrl: string) {
  const hostname = new URL(appUrl).hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  ) {
    return null;
  }

  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

export function createAuth() {
  const db = createDb();
  const isProduction = env.NODE_ENV === "production";

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      crossSubDomainCookies: (() => {
        const domain = getSharedCookieDomain(env.CORS_ORIGIN);
        return domain ? { enabled: true, domain } : undefined;
      })(),
      defaultCookieAttributes: {
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        httpOnly: true,
      },
    },
    plugins: [],
  });
}

export const auth = createAuth();
