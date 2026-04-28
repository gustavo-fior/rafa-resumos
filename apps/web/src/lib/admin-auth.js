import { env as adminEnv } from "@rafa-resumos/env/admin";
import { env as authEnv } from "@rafa-resumos/env/auth";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const ADMIN_COOKIE = "admin_session";
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;
function adminToken() {
    return createHmac("sha256", authEnv.BETTER_AUTH_SECRET)
        .update(`admin:${adminEnv.ADMIN_PASSWORD}`)
        .digest("hex");
}
export async function isAdminAuthed() {
    const cookie = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!cookie)
        return false;
    const expected = adminToken();
    if (cookie.length !== expected.length)
        return false;
    return timingSafeEqual(Buffer.from(cookie), Buffer.from(expected));
}
export async function grantAdminCookie() {
    const store = await cookies();
    store.set(ADMIN_COOKIE, adminToken(), {
        httpOnly: true,
        maxAge: SEVEN_DAYS_SECONDS,
        path: "/admin",
        sameSite: "lax",
        secure: authEnv.NODE_ENV === "production",
    });
}
export async function revokeAdminCookie() {
    const store = await cookies();
    store.delete(ADMIN_COOKIE);
}
export function verifyAdminPassword(password) {
    const expected = Buffer.from(adminEnv.ADMIN_PASSWORD);
    const got = Buffer.from(password);
    if (got.length !== expected.length)
        return false;
    return timingSafeEqual(got, expected);
}
