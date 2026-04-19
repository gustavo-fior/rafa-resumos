import { listPublishedProducts } from "@rafa-resumos/api/services/catalog";

import ProductCard from "@/components/product-card";
import { requireSession } from "@/lib/session";

export default async function DashboardStorePage() {
  const session = await requireSession();
  const products = await listPublishedProducts(
    { excludeOwned: true },
    session.user.id
  );

  return (
    <div className="flex flex-col gap-10 mt-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
