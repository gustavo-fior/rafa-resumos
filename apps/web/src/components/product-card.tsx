import { Card, CardContent } from "@rafa-resumos/ui/components/card";
import type { Route } from "next";
import Link from "next/link";

import { stripLeadingEmoji } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

type ProductCardProps = {
  hidePrice?: boolean;
  product: {
    category: string;
    featured: boolean;
    hasAccess: boolean;
    iconEmoji: string | null;
    iconUrl: string | null;
    priceCents: number;
    slug: string;
    subject: {
      name: string;
      slug: string;
    };
    title: string;
  };
};

export default function ProductCard({ hidePrice, product }: ProductCardProps) {
  const href = (
    product.hasAccess ? `/reader/${product.slug}` : `/products/${product.slug}`
  ) as Route;
  const isFree = product.priceCents === 0;

  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-colors group-hover:bg-muted/30">
        <CardContent className="flex flex-1 flex-col gap-2">
          <div className="flex items-start flex-col gap-1.5">
            <div className="flex justify-between w-full">
              <div className="flex flex-col items-start gap-3">
                {product.iconEmoji ? (
                  <span aria-hidden className="text-xl leading-none">
                    {product.iconEmoji}
                  </span>
                ) : product.iconUrl ? (
                  <img
                    alt=""
                    aria-hidden
                    className="size-5 shrink-0 object-contain"
                    src={product.iconUrl}
                  />
                ) : null}
                {product.category === "Medicina" && (
                  <div className="space-y-0.5">
                    {product.category === "Medicina" ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{stripLeadingEmoji(product.subject.name)}</span>
                        {product.featured ? (
                          <>
                            <span>·</span>
                            <span>Destaque</span>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              {!hidePrice && product.category === "medicina" ? (
                isFree ? (
                  <p className="text-emerald-600 font-medium text-xs">Grátis</p>
                ) : (
                  <p className="text-xs font-medium">
                    {priceFormatter.format(product.priceCents / 100)}
                  </p>
                )
              ) : null}
            </div>
            <h3 className="text-sm font-medium leading-snug line-clamp-2">
              {product.title}
            </h3>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
