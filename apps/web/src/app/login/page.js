import { redirect } from "next/navigation";
import LoginScreen from "@/components/login-screen";
import { getOptionalSession } from "@/lib/session";
export default async function LoginPage() {
    const session = await getOptionalSession();
    if (session?.user) {
        redirect("/dashboard/library");
    }
    return (<main className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md pb-40">
        <LoginScreen />
      </div>
    </main>);
}
