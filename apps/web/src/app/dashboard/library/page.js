import { listLibraryProducts } from "@rafa-resumos/api/services/catalog";
import ProductCard from "@/components/product-card";
import { requireSession } from "@/lib/session";
export default async function DashboardLibraryPage() {
    const session = await requireSession();
    const products = await listLibraryProducts(session.user.id);
    return (<div className="flex flex-col gap-10 mt-8">
      {products.length ? (<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (<ProductCard key={product.id} product={product} hidePrice/>))}
        </div>) : (<div className="rounded border border-dashed border-[#ededec] bg-[#fbfbfa] p-6 text-sm text-[#787774]">
          Nenhum resumo foi liberado para sua conta ainda.
        </div>)}
    </div>);
}
