import ProductCard from "@/components/product-card";
import { stripLeadingEmoji } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { getServerTrpc } from "@/utils/trpc-server";

export default async function DashboardLibraryPage() {
  await requireSession();
  const trpc = await getServerTrpc();
  const allProducts = await trpc.library.listMine.query();
  const products = allProducts.filter(
    (product) => product.category !== "utilidades"
  );

  const groups = new Map<
    string,
    { name: string; products: typeof products }
  >();
  for (const product of products) {
    const existing = groups.get(product.subject.id);
    if (existing) {
      existing.products.push(product);
    } else {
      groups.set(product.subject.id, {
        name: product.subject.name,
        products: [product],
      });
    }
  }

  return (
    <div className="flex flex-col gap-10 mt-8">
      {products.length ? (
        <div className="flex flex-col gap-8">
          {Array.from(groups.values()).map((group) => (
            <section key={group.name} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {stripLeadingEmoji(group.name)}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.products.map((product) => (
                  <ProductCard key={product.id} product={product} hidePrice />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-[#ededec] bg-[#fbfbfa] p-6 text-sm text-[#787774]">
          Nenhum resumo foi liberado para sua conta ainda.
        </div>
      )}
    </div>
  );
}
