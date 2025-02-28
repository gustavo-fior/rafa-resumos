import Head from "next/head";
import { api } from "~/utils/api";

export default function Home() {
  const { data, isLoading } = api.notion.getPages.useQuery();

  return (
    <>
      <Head>
        <title>Notion Pages</title>
        <meta name="description" content="View your Notion pages" />
      </Head>
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <header className="mb-12 border-b border-gray-100 pb-8">
            <h1 className="mb-2 font-serif text-4xl font-light tracking-tight text-gray-900 sm:text-5xl">
              Notion Pages
            </h1>
            <p className="text-lg text-gray-600">
              A minimalist view of your workspace
            </p>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
            </div>
          ) : data?.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-12 text-center">
              <p className="text-lg text-gray-600">
                No Notion pages found in your workspace.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data?.map((page) => (
                <div
                  key={page.id}
                  className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                    {page}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
