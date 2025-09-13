import Footer from "~/components/footer";
import Header from "~/components/header";
import Link from "next/link";
import { InstagramLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import Image from "next/image";

export default function About() {
  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <Header />

          <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-medium text-gray-900">Contribua</h2>

              <div className="flex items-center gap-3">
                <Link
                  href={"https://www.instagram.com/rafa_epc_"}
                  target="_blank"
                >
                  <button className="flex items-center gap-2 whitespace-pre rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-neutral-50">
                    <InstagramLogoIcon className="size-4" />
                  </button>
                </Link>
                <Link href={"https://vsco.co/rafa-epc/gallery"} target="_blank">
                  <button className="flex items-center gap-2 whitespace-pre rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-neutral-50">
                    <Image src="/vsco.png" alt="Vsco" width={16} height={16} />
                  </button>
                </Link>
                <Link
                  href={"https://www.linkedin.com/in/rafaela-castan-7a43ab2bb/"}
                  target="_blank"
                >
                  <button className="flex items-center gap-2 whitespace-pre rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-neutral-50">
                    <LinkedInLogoIcon className="size-4" />
                  </button>
                </Link>
              </div>
            </div>

            <p className="text-lg text-gray-500">
              Manter esse projeto dá um trabalhinho extra, mas faço com carinho!
              Se, de alguma forma, te ajudei e você quiser contribuir para me
              motivar a continuar, criei um PIX (rafacastan.resumos@gmail.com) e
              um ko-fi se quiser contribuir com o paypal ou cartão! Assim pode
              doar da forma que preferir, anônima ou não. Eu agradeceria
              muuuito, e isso ainda me ajudaria a pagar a faculdade!
            </p>

            <p className="text-lg text-gray-500">
              Ko-fi:{" "}
              <Link
                href="https://ko-fi.com/rafacastan"
                target="_blank"
                className="text-gray-900 underline transition-all duration-200 hover:text-gray-700"
              >
                https://ko-fi.com/rafacastan
              </Link>
            </p>

            <p className="text-lg text-gray-500">
              PIX:{" "}
              <span className="text-gray-900">
                rafacastan.resumos@gmail.com
              </span>
            </p>

            <p className="mt-8 text-lg font-medium text-gray-700">
              Fico à disposição e bons estudos! :)
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
