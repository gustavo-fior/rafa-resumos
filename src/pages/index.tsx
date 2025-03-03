import Image from "next/image";
import Link from "next/link";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { api } from "~/utils/api";
import { type PageDetails } from "~/utils/notion";

export default function Home() {
  const { data: contentData, isLoading: contentLoading } =
    api.notion.getContentPages.useQuery();
  const { data: organizationData, isLoading: organizationLoading } =
    api.notion.getOrganizationPages.useQuery();
  const { data: utilitiesData, isLoading: utilitiesLoading } =
    api.notion.getUtilitiesPages.useQuery();

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <Header />

          <blockquote className="mx-auto mt-2 text-gray-600">
            Oiie! Meu nome é Rafaela Castan e aqui disponibilizo meus resumos,
            desenhos, apostilas e outros arquivos que fiz ou reuni ao longo dos
            meus estudos na PUCPR!
          </blockquote>

          <div className="mb-4 mt-8 flex justify-between">
            <h2 className="text-xl font-medium text-gray-900">
              Resumos{" "}
              {contentData && contentData.length > 0 && (
                <span className="text-sm text-gray-500">
                  ({contentData.length})
                </span>
              )}
            </h2>
            <Link
              href={
                "https://www.notion.so/Ciclo-B-sico-Medicina-143fbe83ff3b80b29b8fd9d48281cfe6"
              }
              className="text-sm text-gray-500 transition-all duration-200 hover:text-gray-700 hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {contentLoading ? (
            <div className="flex items-center justify-center pb-16 pt-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
            </div>
          ) : contentData?.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-12 text-center">
              <p className="text-lg text-gray-600">Nenhum resumo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {contentData?.map((page) => <Page key={page.id} page={page} />)}
            </div>
          )}

          <div className="mb-4 mt-12 flex justify-between">
            <h2 className="text-xl font-medium text-gray-900">Organização</h2>
            <Link
              href={
                "https://www.notion.so/Ciclo-B-sico-Organiza-o-1a9fbe83ff3b80b69737e9a23bc91ec6"
              }
              className="text-sm text-gray-500 transition-all duration-200 hover:text-gray-700"
            >
              Ver todos
            </Link>
          </div>
          {organizationLoading ? (
            <div className="flex items-center justify-center pb-16 pt-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
            </div>
          ) : organizationData?.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-12 text-center">
              <p className="text-lg text-gray-600">Nenhum resumo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {organizationData?.map((page) => (
                <Page key={page.id} page={page} />
              ))}
              <Page page={{
                id: "vayo",
                title: "VAYØ (guardador de links)",
                icon: "🔗",
                iconUrl: "",
                publicUrl: "https://vayo.cc",
              }} />
            </div>
          )}

          <div className="mb-4 mt-12 flex justify-between">
            <h2 className="text-xl font-medium text-gray-900">Utilidades</h2>
            <Link
              href={
                "https://www.notion.so/Ciclo-B-sico-Utilidades-1a9fbe83ff3b80fbad6cd6ba67cc1cf5"
              }
              className="text-sm text-gray-500 transition-all duration-200 hover:text-gray-700"
            >
              Ver todos
            </Link>
          </div>
          {utilitiesLoading ? (
            <div className="flex items-center justify-center pb-16 pt-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
            </div>
          ) : utilitiesData?.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-12 text-center">
              <p className="text-lg text-gray-600">Nenhum resumo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {utilitiesData?.map((page) => <Page key={page.id} page={page} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

const Page = ({ page }: { page: PageDetails }) => {
  return (
    <Link
      key={page.id}
      href={page.publicUrl ?? ""}
      target="_blank"
      className="page-card group flex items-center gap-2.5 overflow-hidden rounded-xl border border-gray-200 bg-white px-6 py-4 transition-all duration-200 hover:shadow-sm"
    >
      {page.icon ? (
        <div>{page.icon}</div>
      ) : page.iconUrl ? (
        <Image
          src={page.iconUrl ?? ""}
          alt={page.title}
          width={16}
          height={16}
          priority
        />
      ) : null}
      <div>{page.title}</div>
    </Link>
  );
};
