import HomeCatalogClient from "@/components/home-catalog-client";
import { getServerTrpc } from "@/utils/trpc-server";

type CategoryValue = "medicina" | "utilidades";

const categoryValues: CategoryValue[] = ["medicina", "utilidades"];

const categoryLabels: Record<CategoryValue, string> = {
  medicina: "Resumos",
  utilidades: "Utilidades",
};

export default async function Home() {
  const trpc = await getServerTrpc();

  const [initialSections, subjectsByCategory] = await Promise.all([
    Promise.all(
      categoryValues.map(async (category) => {
        const products = await trpc.catalog.listPublished.query({ category });
        return { category, products };
      })
    ),
    Promise.all(
      categoryValues.map(async (category) => {
        const subjects = await trpc.catalog.listSubjects.query({ category });
        return [category, subjects] as const;
      })
    ).then((entries) => Object.fromEntries(entries)),
  ]);

  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl px-4 pb-16 md:px-0">
      <HomeCatalogClient
        categoryLabels={categoryLabels}
        categoryValues={categoryValues}
        initialSections={initialSections}
        subjectsByCategory={subjectsByCategory}
      />
    </main>
  );
}
