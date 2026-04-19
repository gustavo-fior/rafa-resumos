"use client";

import { Chrome } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@rafa-resumos/ui/components/button";
import { Google } from "./google";

export default function GoogleAuthButton({ label }: { label: string }) {
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={async () => {
        try {
          setIsPending(true);
          await authClient.signIn.social({
            callbackURL: `${window.location.origin}/dashboard/library`,
            provider: "google",
          });
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Falha ao entrar com Google"
          );
          setIsPending(false);
        }
      }}
    >
      <Google className="size-3" />
      {isPending ? "Abrindo Google..." : label}
    </Button>
  );
}
