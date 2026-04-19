"use client";

import { Menu } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@rafa-resumos/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rafa-resumos/ui/components/dropdown-menu";
import UserMenu from "./user-menu";

export default function Header() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();

  const headerImage = pathname.startsWith("/reader")
    ? "/rafa-studying.jpeg"
    : pathname.startsWith("/login")
    ? "/rafa-password.jpeg"
    : pathname.startsWith("/products")
    ? "/rafa-party.jpeg"
    : "/rafa.png";

  const unauthenticatedLinks = [
    { href: "/about", label: "Sobre" },
    { href: "/", label: "Catálogo" },
  ] as const;

  const authenticatedLinks = [
    { href: "/about", label: "Sobre" },
    { href: "/", label: "Catálogo" },
    { href: "/dashboard/library", label: "Sua Biblioteca" },
  ] as const;

  const links = session ? authenticatedLinks : unauthenticatedLinks;

  return (
    <header className="bg-neutral-50">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-6 pt-8 md:px-0">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image
            src={headerImage}
            alt="Rafaela"
            width={42}
            height={42}
            priority
            unoptimized
            className="rounded"
          />
          <span className="font-(family-name:--font-display) text-2xl font-medium text-[#37352f]">
            Resumos
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center md:flex">
            {links.map((link) => {
              return (
                <Link key={link.href} href={link.href as Route}>
                  <Button variant="ghost">{link.label}</Button>
                </Link>
              );
            })}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/30 md:hidden">
              <Menu className="size-5" strokeWidth={1.75} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              {links.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  render={<Link href={link.href as Route} />}
                >
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
