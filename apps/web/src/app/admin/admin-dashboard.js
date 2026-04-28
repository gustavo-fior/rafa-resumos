"use client";
import { Button } from "@rafa-resumos/ui/components/button";
import { Card, CardContent } from "@rafa-resumos/ui/components/card";
import { LogOut, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { logoutAdminAction, syncNotionAction } from "./actions";
function formatCurrency(cents) {
    return new Intl.NumberFormat("pt-BR", {
        currency: "BRL",
        style: "currency",
    }).format(cents / 100);
}
function formatNumber(value) {
    return new Intl.NumberFormat("pt-BR").format(value);
}
function formatDate(value) {
    if (!value)
        return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        return "—";
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}
export default function AdminDashboard({ stats }) {
    const [syncPending, startSync] = useTransition();
    const [logoutPending, startLogout] = useTransition();
    function handleSync() {
        startSync(async () => {
            const result = await syncNotionAction();
            if ("error" in result && result.error) {
                toast.error(result.error);
                return;
            }
            if ("ok" in result && result.ok) {
                toast.success(`Sincronização concluída em ${(result.durationMs / 1000).toFixed(1)}s.`);
            }
        });
    }
    function handleLogout() {
        startLogout(async () => {
            await logoutAdminAction();
        });
    }
    const cards = [
        {
            label: "Usuários",
            value: formatNumber(stats.totalUserCount),
            hint: `${formatNumber(stats.payingUserCount)} pagantes`,
        },
        {
            label: "Receita total",
            value: formatCurrency(stats.totalRevenueCents),
            hint: `${formatNumber(stats.paidOrderCount)} pedidos pagos`,
        },
        {
            label: "Receita por usuário",
            value: formatCurrency(stats.revenuePerUserCents),
            hint: "Média sobre toda a base",
        },
        {
            label: "Receita por pagante",
            value: formatCurrency(stats.revenuePerPayingUserCents),
            hint: "Média entre quem comprou",
        },
        {
            label: "Ticket médio",
            value: formatCurrency(stats.averageOrderCents),
            hint: "Por pedido pago",
        },
        {
            label: "Pedidos pendentes",
            value: formatNumber(stats.pendingOrderCount),
            hint: "Aguardando confirmação",
        },
        {
            label: "Liberações ativas",
            value: formatNumber(stats.totalEntitlementCount),
            hint: "Entitlements sem revogação",
        },
        {
            label: "Produtos",
            value: formatNumber(stats.publishedProductCount),
            hint: `${formatNumber(stats.totalProductCount)} totais (incluindo rascunhos)`,
        },
    ];
    return (<div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Painel admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Estatísticas da plataforma
          </h1>
          <p className="text-sm text-muted-foreground">
            Última sincronização com o Notion: {formatDate(stats.lastSyncAt)}
          </p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={handleLogout} disabled={logoutPending}>
          <LogOut data-icon="inline-start"/>
          Sair
        </Button>
      </header>

      <Card size="sm">
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-sm font-medium">Sincronizar com o Notion</h2>
              <p className="text-xs text-muted-foreground">
                Busca as páginas publicadas no Notion e atualiza o catálogo.
                Pode demorar alguns segundos.
              </p>
            </div>

            <Button type="button" onClick={handleSync} disabled={syncPending}>
              <RefreshCw data-icon="inline-start" className={syncPending ? "animate-spin" : undefined}/>
              {syncPending ? "Sincronizando..." : "Sincronizar agora"}
            </Button>
          </div>

          {stats.lastOrderAt ? (<p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              Último pedido pago: {formatDate(stats.lastOrderAt)}
            </p>) : null}
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (<Card key={card.label} size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">
                {card.value}
              </p>
              {card.hint ? (<p className="mt-0.5 text-xs text-muted-foreground">
                  {card.hint}
                </p>) : null}
            </CardContent>
          </Card>))}
      </section>
    </div>);
}
