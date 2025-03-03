import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="mb-8 flex flex-col items-center justify-between border-b border-neutral-200 pb-4 md:flex-row">
      <Link
        href={"/"}
        className="mx-auto flex items-center gap-2 transition-all duration-200 hover:opacity-70 md:mx-0"
      >
        <Image src="/rafa.png" alt="Notion Pages" width={64} height={64} />
        <h1 className="font-serif text-4xl font-light tracking-tight text-gray-900">
          Resumos
        </h1>
      </Link>
      <div className="mx-auto mt-3 flex flex-col items-center gap-3 sm:flex-row md:mx-0 md:mt-0">
        <div className="flex items-center gap-4">
          <Link href={"/about"}>
            <button className="flex items-center gap-2 whitespace-pre rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-neutral-50">
              🙋🏻‍♀️{"  "}Sobre
            </button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href={"/donate"}>
            <button className="flex items-center gap-2 whitespace-pre rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-neutral-50">
              👍{"  "}Contribua
            </button>
          </Link>
        </div>

        <Link
          href={
            "https://drive.google.com/drive/folders/17yriQHi32y4_LKSfXly1e8sNMK55UIqv?usp=sharing"
          }
          target="_blank"
        >
          <button className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-neutral-50">
            <Image src="/drive.png" alt="Google Drive" width={16} height={16} />
            Arquivos no Drive
          </button>
        </Link>
      </div>
    </header>
  );
}
