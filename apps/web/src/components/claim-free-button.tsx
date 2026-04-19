"use client";

import { Button } from "@rafa-resumos/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpcClient } from "@/utils/trpc";

export default function ClaimFreeButton({ slug }: { slug: string }) {
  const router = useRouter();

  const claimMutation = useMutation({
    mutationFn: () => trpcClient.purchase.claimFree.mutate({ slug }),
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (result) => {
      toast.success(
        result.alreadyOwned
          ? "Você já tem este resumo."
          : "Resumo adicionado à biblioteca."
      );
      router.refresh();
    },
  });

  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => claimMutation.mutate()}
      disabled={claimMutation.isPending}
    >
      {claimMutation.isPending ? (
        <>
          <BookOpen data-icon="inline-start" />
          Adicionando...
        </>
      ) : (
        <>
          <Plus data-icon="inline-start" />
          Adicionar à biblioteca
        </>
      )}
    </Button>
  );
}
