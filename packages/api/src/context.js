import { auth } from "@rafa-resumos/auth";
export async function createContext({ context }) {
    const session = await auth.api.getSession({
        headers: context.req.raw.headers,
    });
    return {
        auth: null,
        session,
    };
}
