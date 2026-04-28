"use client";
import { authClient } from "@/lib/auth-client";
import GoogleAuthButton from "./google-auth-button";
import Loader from "./loader";
export default function LoginScreen() {
    const { isPending } = authClient.useSession();
    if (isPending) {
        return <Loader />;
    }
    return (<div className="w-full">
      <div className="space-y-1.5">
        <h1 className="text-lg font-medium tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground tracking-normal">
          Acompanhe seus resumos e continue de onde parou.
        </p>
      </div>

      <div className="mt-4">
        <GoogleAuthButton label="Continuar com Google"/>
      </div>
    </div>);
}
