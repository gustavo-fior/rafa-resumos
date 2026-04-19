import { env } from "@rafa-resumos/env/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

function adminToken() {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`admin:${env.ADMIN_PASSWORD}`)
    .digest("hex");
}

export async function isAdminAuthed() {
  const cookie = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;

  const expected = adminToken();
  if (cookie.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(cookie), Buffer.from(expected));
}

export async function grantAdminCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    maxAge: SEVEN_DAYS_SECONDS,
    path: "/admin",
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  });
}

export async function revokeAdminCookie() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export function verifyAdminPassword(password: string) {
  const expected = Buffer.from(env.ADMIN_PASSWORD);
  const got = Buffer.from(password);
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}
