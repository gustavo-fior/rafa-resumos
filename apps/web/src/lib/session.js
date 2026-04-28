import { auth } from "@rafa-resumos/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
export async function getOptionalSession() {
    return auth.api.getSession({
        headers: await headers(),
    });
}
export async function requireSession() {
    const session = await getOptionalSession();
    if (!session?.user) {
        redirect("/login");
    }
    return session;
}
