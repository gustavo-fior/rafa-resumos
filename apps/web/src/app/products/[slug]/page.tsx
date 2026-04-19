import { getActivePurchaseForProductSlug } from "@rafa-resumos/api/services/purchase";
import { getPublishedProductBySlug } from "@rafa-resumos/api/services/catalog";
import { Button } from "@rafa-resumos/ui/components/button";
import { Card, CardContent } from "@rafa-resumos/ui/components/card";
import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ClaimFreeButton from "@/components/claim-free-button";
import PurchasePanel from "@/components/purchase-panel";
import { getOptionalSession } from "@/lib/session";

const categoryLabels: Record<string, string> = {
  medicina: "Resumos",
  utilidades: "Utilidades",
};

const HEADING_PATTERN = /^(#{1,3})\s+(.+?)\s*$/gm;

type Heading = { level: number; text: string };

function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let match: RegExpExecArray | null;

  HEADING_PATTERN.lastIndex = 0;
  while ((match = HEADING_PATTERN.exec(markdown)) !== null) {
    const level = match[1]!.length;
    const text = match[2]!.replace(/[*_`]/g, "").trim();
    if (text) headings.push({ level, text });
  }

  return headings;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getOptionalSession();
  const [product, activePurchase] = await Promise.all([
    getPublishedProductBySlug(slug, session?.user.id),
    session?.user
      ? getActivePurchaseForProductSlug(session.user.id, slug)
      : Promise.resolve(null),
  ]);

  if (!product) {
    notFound();
  }

  const isFree = product.priceCents === 0;
  const formattedPrice = isFree
    ? "Grátis"
    : new Intl.NumberFormat("pt-BR", {
        currency: "BRL",
        style: "currency",
      }).format(product.priceCents / 100);

  const headings = product.contentMarkdown
    ? extractHeadings(product.contentMarkdown)
    : [];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 md:px-0">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#787774] transition-colors hover:text-[#37352f]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Voltar ao catálogo
      </Link>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{categoryLabels[product.category] ?? product.category}</span>
            {product.featured ? (
              <>
                <span>·</span>
                <span>Destaque</span>
              </>
            ) : null}
          </div>
          <h1 className="flex items-start flex-col gap-3 text-4xl">
            {product.iconEmoji ? (
              <span aria-hidden className="leading-none">
                {product.iconEmoji}
              </span>
            ) : product.iconUrl ? (
              <img
                alt=""
                aria-hidden
                className="mt-1 size-8 shrink-0 object-contain"
                src={product.iconUrl}
              />
            ) : null}
            <span className="text-2xl font-semibold tracking-tight">
              {product.title}
            </span>
          </h1>

          {headings.length > 0 ? (
            <div className="border-t border-[#ededec] pt-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-[#787774]">
                Conteúdo
              </h2>
              <ul className="mt-3 space-y-1.5">
                {headings.map((heading, index) => (
                  <li
                    key={`${index}-${heading.text}`}
                    className="text-sm leading-relaxed text-[#37352f]"
                    style={{
                      paddingLeft: `${(heading.level - 1) * 1}rem`,
                    }}
                  >
                    <span
                      className={
                        heading.level === 1
                          ? "font-medium"
                          : heading.level === 2
                          ? ""
                          : "text-[#787774]"
                      }
                    >
                      {heading.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          {!isFree && (
            <Card size="sm" className="px-0.5">
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Valor</span>
                  <span
                    className={
                      isFree
                        ? "text-lg font-semibold text-[#0f7b4f]"
                        : "text-lg font-semibold"
                    }
                  >
                    {formattedPrice}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {product.hasAccess ? (
            <Button
              className="w-full"
              render={<Link href={`/reader/${product.slug}` as Route} />}
            >
              Abrir resumo completo
            </Button>
          ) : session?.user ? (
            isFree ? (
              <ClaimFreeButton slug={product.slug} />
            ) : (
              <PurchasePanel
                initialPurchase={activePurchase}
                priceCents={product.priceCents}
                slug={product.slug}
                title={product.title}
              />
            )
          ) : (
            <Card>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Crie sua conta para acompanhar sua biblioteca pessoal e
                  acessar os resumos liberados.
                </p>
                <Button className="w-full" render={<Link href="/login" />}>
                  Entrar para acompanhar
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </section>
    </main>
  );
}
