import {
  categoryValues,
  listPublishedProducts,
  listPublishedSubjects,
} from "@rafa-resumos/api/services/catalog";
import HomeCatalogClient from "@/components/home-catalog-client";
import { getOptionalSession } from "@/lib/session";

const categoryLabels: Record<(typeof categoryValues)[number], string> = {
  medicina: "Resumos",
  utilidades: "Utilidades",
};

export default async function Home() {
  const session = await getOptionalSession();

  const [initialSections, subjectsByCategory] = await Promise.all([
    Promise.all(
      categoryValues.map(async (category) => {
        const products = await listPublishedProducts(
          {
            category,
          },
          session?.user.id
        );
        return { category, products };
      })
    ),
    Promise.all(
      categoryValues.map(async (category) => {
        const subjects = await listPublishedSubjects(category);
        return [category, subjects] as const;
      })
    ).then((entries) => Object.fromEntries(entries)),
  ]);

  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip px-4 pb-16 md:px-0">
      <HomeCatalogClient
        categoryLabels={categoryLabels}
        categoryValues={categoryValues}
        initialSections={initialSections}
        subjectsByCategory={subjectsByCategory}
      />
    </main>
  );
}
