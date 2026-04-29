"use client";

import { AnimatedTabs } from "@rafa-resumos/ui/components/animated-tabs";
import { Album, BookA, BookOpen, Store } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard/library", label: "Sua Biblioteca", icon: Album },
  { href: "/", label: "Catálogo", icon: Store },
] as const;

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  const activeHref =
    links.find(({ href }) =>
      href === "/" ? pathname === "/" : pathname.startsWith(href)
    )?.href ?? links[0].href;

  return (
    <AnimatedTabs
      tabs={links.map(({ href, label, icon: Icon }) => ({
        label: (
          <span className="flex items-center gap-1.5">
            <Icon className={`size-3.5`} strokeWidth={2.25} />
            {label}
          </span>
        ),
        value: href,
      }))}
      value={activeHref}
      onValueChange={(value) => router.push(value as Route)}
    />
  );
}
