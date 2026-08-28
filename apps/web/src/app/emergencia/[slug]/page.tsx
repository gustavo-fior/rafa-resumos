import { TRPCClientError } from "@trpc/client";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import MarkdownRenderer from "@/components/markdown-renderer";
import { getServerTrpc } from "@/utils/trpc-server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function loadProduct(slug: string) {
  const trpc = await getServerTrpc();
  try {
    return await trpc.catalog.getEmergencyBySlug.query({ slug });
  } catch (error) {
    if (error instanceof TRPCClientError && error.data?.code === "NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) {
    return { title: "Emergência — Rafa Resumos" };
  }
  return {
    title: `${product.title} — Emergência — Rafa Resumos`,
    description: product.seoDescription ?? undefined,
  };
}

export default async function EmergencyContentPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 pt-6 md:px-0">
      <Link
        href="/emergencia"
        className="inline-flex items-center gap-1.5 text-sm text-[#787774] transition-colors hover:text-[#37352f]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Voltar para Emergência
      </Link>

      <header className="mt-10 space-y-3">
        <h1 className="flex flex-col items-start gap-3 text-3xl font-medium leading-tight tracking-tight text-[#37352f] sm:text-4xl">
          {product.iconEmoji ? (
            <span aria-hidden className="leading-none">
              {product.iconEmoji}
            </span>
          ) : product.iconUrl ? (
            <img
              alt=""
              aria-hidden
              className="mt-1 size-10 shrink-0 object-contain"
              src={product.iconUrl}
            />
          ) : null}
          <span className="text-3xl">{product.title}</span>
        </h1>
      </header>

      <div className="mt-4">
        {product.contentMarkdown ? (
          <MarkdownRenderer content={product.contentMarkdown} />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-[#fbfbfa] p-6 text-sm text-[#787774]">
            Este conteúdo ainda não foi sincronizado do Notion.
          </div>
        )}
      </div>
    </main>
  );
}
