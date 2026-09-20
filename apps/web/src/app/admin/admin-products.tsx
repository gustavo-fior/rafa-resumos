"use client";

import type { AppRouter } from "@rafa-resumos/api/routers/index";
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
import { Badge } from "@rafa-resumos/ui/components/badge";
import { Button } from "@rafa-resumos/ui/components/button";
import { Card, CardContent } from "@rafa-resumos/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@rafa-resumos/ui/components/collapsible";
import { Input } from "@rafa-resumos/ui/components/input";
import type { inferRouterOutputs } from "@trpc/server";
import { ChevronDown, RotateCcw, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteProductAction, restoreProductAction } from "./actions";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type AdminProductItem = RouterOutputs["admin"]["listProducts"][number];
export type AdminExcludedItem =
  RouterOutputs["admin"]["listExcludedProducts"][number];

const STATUS_LABEL: Record<AdminProductItem["status"], string> = {
  archived: "Arquivado",
  draft: "Rascunho",
  published: "Publicado",
};

const CATEGORY_LABEL: Record<AdminProductItem["category"], string> = {
  emergencia: "Emergência",
  medicina: "Medicina",
  utilidades: "Utilidades",
};

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

function plural(count: number, singular: string, pluralForm: string) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

function ProductIcon({ product }: { product: AdminProductItem }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-base">
      {product.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.iconUrl} alt="" className="size-full object-cover" />
      ) : product.iconEmoji ? (
        <span aria-hidden>{product.iconEmoji}</span>
      ) : (
        <span aria-hidden className="text-xs text-muted-foreground">
          {product.title.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function DeleteProductDialog({ product }: { product: AdminProductItem }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const hasBuyers = product.activeEntitlementCount > 0 || product.paidOrderCount > 0;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${product.title}" foi excluído.`);
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Excluir ${product.title}`}
          >
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{product.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            O resumo some do catálogo imediatamente e a página do Notion deixa
            de ser importada nas próximas sincronizações. Você pode restaurar
            depois na lista de excluídos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasBuyers ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            Atenção: este resumo tem{" "}
            {plural(product.activeEntitlementCount, "liberação ativa", "liberações ativas")}{" "}
            e {plural(product.paidOrderCount, "pedido pago", "pedidos pagos")}.
            Os compradores perdem o acesso e o histórico desses pedidos é
            apagado.
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? "Excluindo..." : "Excluir resumo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RestoreButton({ item }: { item: AdminExcludedItem }) {
  const [pending, startTransition] = useTransition();

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreProductAction(item.notionPageId);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `"${item.title}" volta ao catálogo na próxima sincronização.`
      );
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRestore}
      disabled={pending}
    >
      <RotateCcw data-icon="inline-start" />
      {pending ? "Restaurando..." : "Restaurar"}
    </Button>
  );
}

export default function AdminProducts({
  products,
  excludedProducts,
}: {
  products: AdminProductItem[];
  excludedProducts: AdminExcludedItem[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle) ||
        p.subjectName.toLowerCase().includes(needle)
    );
  }, [products, query]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-medium">Resumos</h2>
          <p className="text-xs text-muted-foreground">
            {formatNumber(products.length)} no catálogo. Excluir um resumo
            também impede que o Notion o traga de volta.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título ou assunto"
            className="pl-8"
            aria-label="Buscar resumos"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card size="sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {products.length === 0
                ? "Nenhum resumo sincronizado ainda."
                : "Nenhum resumo corresponde à busca."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card size="sm" className="py-0">
          <CardContent className="divide-y divide-border p-0">
            {filtered.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3">
                <ProductIcon product={product} />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium">
                      {product.title}
                    </p>
                    <Badge
                      variant={
                        product.status === "published" ? "secondary" : "outline"
                      }
                    >
                      {STATUS_LABEL[product.status]}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {product.subjectName} · {CATEGORY_LABEL[product.category]} ·{" "}
                    <span className="font-mono">{product.slug}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plural(product.activeEntitlementCount, "liberação", "liberações")}{" "}
                    · {plural(product.paidOrderCount, "pedido pago", "pedidos pagos")}{" "}
                    · sincronizado em {formatDate(product.lastSyncedAt)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium tabular-nums">
                  {formatCurrency(product.priceCents)}
                </span>
                <DeleteProductDialog product={product} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {excludedProducts.length > 0 ? (
        <Collapsible>
          <Card size="sm" className="py-0">
            <CollapsibleTrigger className="group/excluded flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-muted/50">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  Resumos excluídos ({formatNumber(excludedProducts.length)})
                </p>
                <p className="text-xs text-muted-foreground">
                  Ignorados pela sincronização. Restaure para importar de novo.
                </p>
              </div>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]/excluded:rotate-180"
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden h-(--collapsible-panel-height) transition-[height] duration-200 ease-out data-starting-style:h-0 data-ending-style:h-0">
              <CardContent className="divide-y divide-border border-t p-0">
                {excludedProducts.map((item) => (
                  <div
                    key={item.notionPageId}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{item.slug}</span> · excluído
                        em {formatDate(item.excludedAt)}
                      </p>
                    </div>
                    <RestoreButton item={item} />
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ) : null}
    </section>
  );
}
