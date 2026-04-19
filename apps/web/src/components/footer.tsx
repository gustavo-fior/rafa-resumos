import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pb-8 pt-16">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-neutral-400">
          Feito com ❤️ por{" "}
          <Link
            href="https://gustavofior.com"
            target="_blank"
            className="underline transition-all duration-200 hover:opacity-70 text-primary"
          >
            Gu
          </Link>{" "}
          e <span className="text-primary">Rafa</span> :)
        </p>
      </div>
    </footer>
  );
}
