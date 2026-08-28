import { Card, CardContent } from "@rafa-resumos/ui/components/card";
import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";

import { getServerTrpc } from "@/utils/trpc-server";

export const metadata: Metadata = {
  title: "Emergência — Rafa Resumos",
  description:
    "Conteúdos de emergência, abertos para todos, sem necessidade de conta.",
};

export default async function EmergencyPage() {
  const trpc = await getServerTrpc();
  const products = await trpc.catalog.listEmergency.query();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 pt-6 md:px-0">
      <header className="space-y-2">
        <h1 className="font-(family-name:--font-display) text-xl font-semibold text-[#37352f]">
          Emergência
        </h1>
        <p className="text-sm text-balance text-[#787774]">
          Conteúdos de acesso livre para consulta rápida. Não é necessário
          criar conta.
        </p>
      </header>

      <section className="mt-8">
        {products.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/emergencia/${product.slug}` as Route}
                className="group block"
              >
                <Card className="h-full transition-colors group-hover:bg-muted/30">
                  <CardContent className="flex flex-1 flex-col gap-3">
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
                    <h2 className="text-sm font-medium leading-snug line-clamp-2">
                      {product.title}
                    </h2>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-[#ededec] bg-[#fbfbfa] p-6 text-sm text-[#787774]">
            Nenhum conteúdo de emergência publicado ainda.
          </div>
        )}
      </section>
    </main>
  );
}
