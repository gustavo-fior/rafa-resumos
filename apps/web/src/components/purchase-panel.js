"use client";
import { Button } from "@rafa-resumos/ui/components/button";
import { Card, CardContent } from "@rafa-resumos/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
function formatDateLabel(value) {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "2-digit",
    }).format(date);
}
export default function PurchasePanel({ initialPurchase, priceCents: _priceCents, slug, title, }) {
    const [purchase, setPurchase] = useState(initialPurchase);
    const createPixMutation = useMutation({
        mutationFn: () => trpcClient.purchase.createPix.mutate({ slug }),
        onError: (error) => {
            toast.error(error.message);
        },
        onSuccess: (data) => {
            setPurchase(data);
        },
    });
    const simulatePixMutation = useMutation({
        mutationFn: async (orderId) => trpcClient.purchase.simulatePix.mutate({ orderId }),
        onError: (error) => {
            toast.error(error.message);
        },
        onSuccess: (data) => {
            setPurchase(data);
            toast.success("Pagamento simulado. O status vai atualizar em instantes.");
        },
    });
    useQuery({
        enabled: Boolean(purchase?.orderId) && purchase?.status === "pending",
        queryFn: async () => {
            const nextPurchase = await trpcClient.purchase.getStatus.query({
                orderId: purchase.orderId,
            });
            setPurchase(nextPurchase);
            return nextPurchase;
        },
        queryKey: ["purchase-status", purchase?.orderId],
        refetchInterval: (query) => query.state.data?.status === "pending" ? 3000 : false,
    });
    const expiresAtLabel = formatDateLabel(purchase?.expiresAt ?? null);
    const isBusy = createPixMutation.isPending || simulatePixMutation.isPending;
    async function copyPixCode() {
        if (!purchase?.brCode) {
            return;
        }
        try {
            await navigator.clipboard.writeText(purchase.brCode);
            toast.success("Código PIX copiado.");
        }
        catch {
            toast.error("Não foi possível copiar o código PIX.");
        }
    }
    if (purchase?.status === "paid" ||
        purchase?.alreadyOwned ||
        purchase?.hasAccess) {
        return (<Card size="sm">
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Resumo liberado</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              O pagamento foi confirmado e este resumo já está na sua
              biblioteca.
            </p>
          </div>

          <div className="space-y-2">
            <Button className="w-full" render={<Link href={`/reader/${slug}`}/>}>
              Abrir resumo completo
            </Button>
            <Button variant="outline" className="w-full" render={<Link href="/dashboard/library"/>}>
              Ir para a biblioteca
            </Button>
          </div>
        </CardContent>
      </Card>);
    }
    if (!purchase ||
        purchase.status === "failed" ||
        purchase.status === "expired") {
        return (<Card size="sm">
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Compra via PIX</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Gere o QR Code para liberar{" "}
              <span className="text-foreground">{title}</span> na sua
              biblioteca.
            </p>
          </div>

          {purchase?.status === "expired" ? (<p className="text-xs leading-relaxed text-muted-foreground">
              O QR Code anterior expirou. Gere um novo PIX para continuar.
            </p>) : purchase?.status === "failed" ? (<p className="text-xs leading-relaxed text-muted-foreground">
              Não foi possível criar o PIX anterior. Tente novamente.
            </p>) : null}

          <Button type="button" className="w-full" disabled={isBusy} onClick={() => createPixMutation.mutate()}>
            {isBusy ? "Gerando PIX..." : "Gerar PIX"}
          </Button>
        </CardContent>
      </Card>);
    }
    if (purchase.status === "pending" &&
        purchase.brCode &&
        purchase.brCodeBase64) {
        return (<Card size="sm">
        <CardContent className="space-y-3">
          <div className="flex flex-col items-center gap-3">
            <img alt={`QR Code PIX para ${title}`} className="size-56 rounded-xl border bg-background" src={purchase.brCodeBase64}/>
            <div className="w-full rounded-xl border bg-background p-3">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                PIX copia e cola
              </p>
              <p className="break-all font-mono text-xs leading-relaxed">
                {purchase.brCode}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button type="button" className="w-full" onClick={copyPixCode}>
              Copiar código PIX
            </Button>
            {purchase.canSimulate && purchase.orderId ? (<Button type="button" variant="outline" className="w-full" disabled={simulatePixMutation.isPending} onClick={() => simulatePixMutation.mutate(purchase.orderId)}>
                {simulatePixMutation.isPending
                    ? "Simulando..."
                    : "Simular pagamento"}
              </Button>) : null}
          </div>

          <div className="space-y-0.5 text-xs text-muted-foreground">
            {purchase.canSimulate && (<p>
                Status:{" "}
                <span className="text-foreground">
                  {purchase.providerStatus ?? "PENDING"}
                </span>
              </p>)}
            {expiresAtLabel ? <p>Expira em: {expiresAtLabel}</p> : null}
            <p>A confirmação acontece automaticamente.</p>
          </div>
        </CardContent>
      </Card>);
    }
    if (purchase.status === "refunded" || purchase.status === "disputed") {
        return (<Card size="sm">
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          Este pagamento foi marcado como{" "}
          {purchase.status === "refunded" ? "reembolsado" : "em disputa"}.
        </CardContent>
      </Card>);
    }
    return null;
}
