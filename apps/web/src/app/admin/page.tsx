import { TRPCClientError } from "@trpc/client";

import { isAdminAuthed } from "@/lib/admin-auth";
import { getServerTrpc } from "@/utils/trpc-server";

import AdminLoginForm from "./admin-login-form";
import AdminDashboard from "./admin-dashboard";

export const dynamic = "force-dynamic";

function LoginShell({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-3.25rem)] w-full max-w-md items-center py-12">
      <AdminLoginForm initialError={error} />
    </main>
  );
}

export default async function AdminPage() {
  const authed = await isAdminAuthed();

  if (!authed) {
    return <LoginShell />;
  }

  const trpc = await getServerTrpc();

  try {
    const [stats, users] = await Promise.all([
      trpc.admin.getStats.query(),
      trpc.admin.listUsers.query(),
    ]);

    return (
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 md:px-0">
        <AdminDashboard stats={stats} users={users} />
      </main>
    );
  } catch (error) {
    // The local admin cookie verified, but the backend (Fly) rejected the
    // forwarded admin token — almost always a BETTER_AUTH_SECRET/ADMIN_PASSWORD
    // mismatch between this web deployment and the server. Surface it instead
    // of throwing in the post-login render (which left "Entrando..." hung
    // forever with no feedback).
    const status =
      error instanceof TRPCClientError
        ? (error.data?.httpStatus as number | undefined)
        : undefined;

    if (status === 401 || status === 403) {
      return (
        <LoginShell error="O servidor recusou as credenciais de admin. Verifique se BETTER_AUTH_SECRET e ADMIN_PASSWORD são iguais no front-end e no back-end." />
      );
    }

    return (
      <LoginShell error="Não foi possível carregar o painel. Tente novamente em instantes." />
    );
  }
}
