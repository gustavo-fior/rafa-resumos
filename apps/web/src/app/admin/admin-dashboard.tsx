"use client";

import type {
  AdminStats,
  AdminUserListItem,
} from "@rafa-resumos/api/services/admin-stats";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@rafa-resumos/ui/components/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rafa-resumos/ui/components/avatar";
import { Button } from "@rafa-resumos/ui/components/button";
import { Card, CardContent } from "@rafa-resumos/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@rafa-resumos/ui/components/collapsible";
import { Input } from "@rafa-resumos/ui/components/input";
import { Label } from "@rafa-resumos/ui/components/label";
import { ChevronDown, LogOut, RefreshCw, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  logoutAdminAction,
  resetFinanceStatsAction,
  syncNotionAction,
} from "./actions";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdminDashboard({
  stats,
  users,
}: {
  stats: AdminStats;
  users: AdminUserListItem[];
}) {
  const [syncPending, startSync] = useTransition();
  const [logoutPending, startLogout] = useTransition();
  const [resetPending, startReset] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  function handleSync() {
    startSync(async () => {
      const result = await syncNotionAction();
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if ("ok" in result && result.ok) {
        toast.success(
          `Sincronização concluída em ${(result.durationMs / 1000).toFixed(
            1
          )}s.`
        );
      }
    });
  }

  function handleLogout() {
    startLogout(async () => {
      await logoutAdminAction();
    });
  }

  function handleReset() {
    setResetError(null);
    startReset(async () => {
      const result = await resetFinanceStatsAction(resetPassword);
      if ("error" in result && result.error) {
        setResetError(result.error);
        return;
      }
      toast.success("Pedidos e liberações apagados.");
      setResetOpen(false);
      setResetPassword("");
    });
  }

  const cards: Array<{ hint?: string; label: string; value: string }> = [
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
      hint: `${formatNumber(
        stats.totalProductCount
      )} totais (incluindo rascunhos)`,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Estatísticas da plataforma
          </h1>
          <p className="text-sm text-muted-foreground">
            Última sincronização com o Notion: {formatDate(stats.lastSyncAt)}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={logoutPending}
        >
          <LogOut data-icon="inline-start" />
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
              <RefreshCw
                data-icon="inline-start"
                className={syncPending ? "animate-spin" : undefined}
              />
              {syncPending ? "Sincronizando..." : "Sincronizar agora"}
            </Button>
          </div>

          {stats.lastOrderAt ? (
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              Último pedido pago: {formatDate(stats.lastOrderAt)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-sm font-medium">Apagar pedidos de teste</h2>
              <p className="text-xs text-muted-foreground">
                Remove todos os pedidos, liberações e eventos de webhook.
                Usuários e produtos permanecem intactos.
              </p>
            </div>

            <AlertDialog
              open={resetOpen}
              onOpenChange={(open) => {
                setResetOpen(open);
                if (!open) {
                  setResetPassword("");
                  setResetError(null);
                }
              }}
            >
              <AlertDialogTrigger
                render={
                  <Button type="button" variant="outline">
                    <Trash2 data-icon="inline-start" />
                    Apagar
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar pedidos de teste?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação remove permanentemente todos os pedidos,
                    liberações e eventos de webhook. Confirme com a senha de
                    admin.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-1.5">
                  <Label htmlFor="reset-password" className="text-xs">
                    Senha de admin
                  </Label>
                  <Input
                    id="reset-password"
                    type="password"
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    autoFocus
                  />
                  {resetError ? (
                    <p className="text-xs text-destructive">{resetError}</p>
                  ) : null}
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={resetPending}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    variant="destructive"
                    onClick={handleReset}
                    disabled={resetPending || resetPassword.length === 0}
                  >
                    {resetPending ? "Apagando..." : "Apagar tudo"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">
                {card.value}
              </p>
              {card.hint ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {card.hint}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Usuários</h2>
          <p className="text-xs text-muted-foreground">
            {formatNumber(users.length)} no total
          </p>
        </div>

        {users.length === 0 ? (
          <Card size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhum usuário cadastrado ainda.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card size="sm" className="py-0">
            <CardContent className="divide-y divide-border p-0">
              {users.map((u) => (
                <Collapsible key={u.id}>
                  <CollapsibleTrigger className="group/row flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50">
                    <Avatar size="lg">
                      {u.image ? (
                        <AvatarImage src={u.image} alt={u.name} />
                      ) : null}
                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {u.products.length === 0
                        ? "0 produtos"
                        : `${formatNumber(u.products.length)} ${
                            u.products.length === 1 ? "produto" : "produtos"
                          }`}
                    </span>
                    <ChevronDown
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]/row:rotate-180"
                      aria-hidden
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden h-(--collapsible-panel-height) transition-[height] duration-200 ease-out data-starting-style:h-0 data-ending-style:h-0">
                    <div className="px-4 pb-4 pl-[4.25rem]">
                      {u.products.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Nenhum produto comprado.
                        </span>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {u.products.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-3 rounded-md border bg-card p-3"
                            >
                              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-base">
                                {p.iconUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.iconUrl}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                ) : p.iconEmoji ? (
                                  <span aria-hidden>{p.iconEmoji}</span>
                                ) : (
                                  <span
                                    aria-hidden
                                    className="text-xs text-muted-foreground"
                                  >
                                    {getInitials(p.title)}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="truncate text-sm font-medium">
                                  {p.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Liberado em {formatDate(p.grantedAt)}
                                </p>
                              </div>
                              <span className="shrink-0 text-xs font-medium tabular-nums">
                                {formatCurrency(p.priceCents)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
