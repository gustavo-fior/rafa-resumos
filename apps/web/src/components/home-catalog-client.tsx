"use client";

import { AnimatedTabs } from "@rafa-resumos/ui/components/animated-tabs";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@rafa-resumos/ui/components/input-group";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import ProductCard from "@/components/product-card";
import SubjectCard from "@/components/subject-card";
import { stripLeadingEmoji } from "@/lib/utils";
import { Button } from "@rafa-resumos/ui/components/button";

type CatalogSubject = {
  id: string;
  name: string;
  slug: string;
};

type CatalogProduct = {
  id: string;
  category: string;
  featured: boolean;
  hasAccess: boolean;
  iconEmoji: string | null;
  iconUrl: string | null;
  priceCents: number;
  slug: string;
  subject: {
    name: string;
    slug: string;
  };
  title: string;
};

type CategorySectionData = {
  category: string;
  products: CatalogProduct[];
};

type HomeCatalogClientProps = {
  categoryLabels: Record<string, string>;
  categoryValues: string[];
  initialSections: CategorySectionData[];
  subjectsByCategory: Record<string, CatalogSubject[]>;
};

export default function HomeCatalogClient({
  categoryLabels,
  categoryValues,
  initialSections,
  subjectsByCategory,
}: HomeCatalogClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(
    undefined
  );
  const [activeSubject, setActiveSubject] = useState<string | undefined>(
    undefined
  );
  const [search, setSearch] = useState("");

  const hasFilters = Boolean(activeCategory || activeSubject || search.trim());

  const { availableSubjects, subjectCategoryBySlug } = useMemo(() => {
    const bySlug = new Map<string, CatalogSubject>();
    const categoryBySlug = new Map<string, string>();
    for (const category of categoryValues) {
      for (const subject of subjectsByCategory[category] ?? []) {
        bySlug.set(subject.slug, subject);
        categoryBySlug.set(subject.slug, category);
      }
    }
    return {
      availableSubjects: [...bySlug.values()],
      subjectCategoryBySlug: categoryBySlug,
    };
  }, [categoryValues, subjectsByCategory]);

  const filteredSections = useMemo(() => {
    const categoriesToRender = activeCategory
      ? [activeCategory]
      : categoryValues;
    const normalizedSearch = search.trim().toLowerCase();

    return categoriesToRender.map((category) => {
      const showSubjects =
        category === "medicina" && !activeSubject && !normalizedSearch;

      if (showSubjects) {
        return {
          category,
          kind: "subjects" as const,
          subjects: subjectsByCategory[category] ?? [],
        };
      }

      const sourceProducts =
        initialSections.find((section) => section.category === category)
          ?.products ?? [];
      const products = sourceProducts.filter((product) => {
        if (activeSubject && product.subject.slug !== activeSubject) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const haystack =
          `${product.title} ${product.subject.name}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      });

      return {
        category,
        kind: "products" as const,
        products,
      };
    });
  }, [
    activeCategory,
    activeSubject,
    categoryValues,
    initialSections,
    search,
    subjectsByCategory,
  ]);

  const subjectTabs = [
    { label: "Tudo", value: "__all-subjects__" },
    ...availableSubjects.map((subject) => ({
      label: stripLeadingEmoji(subject.name),
      value: subject.slug,
    })),
  ];

  return (
    <>
      <section className="mt-8 space-y-6">
        <InputGroup
          style={{
            boxShadow:
              "0px 0px 0px 1px rgba(0, 0, 0, 0.06), 0px 1px 2px -1px rgba(0, 0, 0, 0.06), 0px 2px 4px 0px rgba(0, 0, 0, 0.04)",
          }}
          className="bg-white h-10 rounded-full"
        >
          <InputGroupAddon align="inline-start">
            <Search strokeWidth={1.75} className="size-3.5 ml-0.5 mr-0.5" />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título ou assunto"
          />
        </InputGroup>

        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AnimatedTabs
            tabs={subjectTabs}
            value={activeSubject ?? "__all-subjects__"}
            onValueChange={(value) => {
              if (value === "__all-subjects__") {
                setActiveCategory(undefined);
                setActiveSubject(undefined);
                return;
              }
              setActiveCategory(subjectCategoryBySlug.get(value));
              setActiveSubject(value);
            }}
          />
        </div>
      </section>

      <div className="mt-10 space-y-10">
        {filteredSections.map((section) => {
          const count =
            section.kind === "subjects"
              ? section.subjects.length
              : section.products.length;

          return (
            <section key={section.category}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-[#37352f]">
                  {categoryLabels[section.category]}
                  <span className="ml-2 text-xs font-normal text-[#9b9a97]">
                    {count}
                  </span>
                </h2>
                {hasFilters ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground font-normal"
                    onClick={() => {
                      setActiveCategory(undefined);
                      setActiveSubject(undefined);
                      setSearch("");
                    }}
                  >
                    Limpar filtros
                  </Button>
                ) : null}
              </div>

              {section.kind === "subjects" ? (
                section.subjects.length ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {section.subjects.map((subject) => (
                      <SubjectCard
                        key={subject.id}
                        subject={subject}
                        onClick={() => {
                          setActiveCategory(section.category);
                          setActiveSubject(subject.slug);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-[#ededec] bg-[#fbfbfa] p-6 text-sm text-[#787774]">
                    Nenhuma matéria cadastrada ainda.
                  </div>
                )
              ) : section.products.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {section.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded border border-dashed border-[#ededec] bg-[#fbfbfa] p-6 text-sm text-[#787774]">
                  Nenhum resumo encontrado nesta seção com os filtros atuais.
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
