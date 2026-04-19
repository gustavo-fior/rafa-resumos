import { getAdminStats } from "@rafa-resumos/api/services/admin-stats";

import { isAdminAuthed } from "@/lib/admin-auth";

import AdminLoginForm from "./admin-login-form";
import AdminDashboard from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminAuthed();

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-3.25rem)] w-full max-w-md items-center py-12">
        <AdminLoginForm />
      </main>
    );
  }

  const stats = await getAdminStats();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 md:px-0">
      <AdminDashboard stats={stats} />
    </main>
  );
}
