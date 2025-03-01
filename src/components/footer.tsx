import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pb-8 pt-4">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-gray-600">
          Feito com ❤️ por{" "}
          <Link
            href="https://gustavofior.com"
            target="_blank"
            className="underline transition-all duration-200 hover:opacity-70"
          >
            Gu
          </Link>{" "}
          e Rafa :)
        </p>
      </div>
    </footer>
  );
}
