import { getReaderProduct } from "@rafa-resumos/api/services/catalog";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarkdownRenderer from "@/components/markdown-renderer";
import { requireSession } from "@/lib/session";
const categoryLabels = {
    medicina: "Resumos",
    utilidades: "Utilidades",
};
export default async function ReaderPage({ params, }) {
    const { slug } = await params;
    const session = await requireSession();
    const product = await getReaderProduct(slug, session.user.id);
    if (!product) {
        notFound();
    }
    if (!product.hasAccess) {
        return (<main className="mx-auto w-full max-w-4xl px-4 py-12 md:px-0">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#9b9a97]">
            Acesso bloqueado
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#37352f] sm:text-4xl">
            {product.title}
          </h1>
          <p className="text-sm leading-relaxed text-[#787774]">
            Esta página existe na plataforma, mas ainda não foi liberada para a
            sua biblioteca.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`/products/${product.slug}`} className="flex h-9 items-center justify-center rounded bg-[#37352f] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2f2d29]">
              Ver detalhes do resumo
            </Link>
            <Link href="/dashboard/library" className="flex h-9 items-center justify-center rounded border border-[#ededec] bg-white px-4 text-sm text-[#37352f] transition-colors hover:bg-[#fbfbfa]">
              Voltar para a biblioteca
            </Link>
          </div>
        </div>
      </main>);
    }
    return (<main className="mx-auto w-full max-w-4xl px-4 py-12 pt-6 md:px-0">
      <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 text-sm text-[#787774] transition-colors hover:text-[#37352f]">
        <ArrowLeft className="size-3.5" strokeWidth={1.75}/>
        Voltar para a biblioteca
      </Link>

      <header className="mt-10 space-y-3">
        <h1 className="flex flex-col items-start gap-3 text-3xl font-medium leading-tight tracking-tight text-[#37352f] sm:text-4xl">
          {product.iconEmoji ? (<span aria-hidden className="leading-none">
              {product.iconEmoji}
            </span>) : product.iconUrl ? (<img alt="" aria-hidden className="mt-1 size-10 shrink-0 object-contain" src={product.iconUrl}/>) : null}
          <span className="text-3xl">{product.title}</span>
        </h1>
      </header>

      <div className="mt-4">
        {product.contentMarkdown ? (<MarkdownRenderer content={product.contentMarkdown}/>) : (<div className="rounded-xl border border-dashed border-border bg-[#fbfbfa] p-6 text-sm text-[#787774]">
            Este resumo já está liberado para sua conta, mas o conteúdo ainda
            não foi sincronizado do Notion.
          </div>)}
      </div>
    </main>);
}
