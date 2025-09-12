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
              <h2 className="text-2xl font-medium text-gray-900">Sobre</h2>

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
              Oiie! Meu nome é Rafaela Castan e aqui disponibilizo meus resumos,
              desenhos, apostilas e outros arquivos que fiz ou reuni ao longo
              dos meus estudos na PUCPR!
            </p>
            <p className="text-lg text-gray-500">
              Durante meus estudos, percebi que resumos bem organizados, com
              imagens e desenhos, me ajudavam muito a entender as matérias. Além
              disso, muitos colegas começaram a pedir meus resumos, o que me
              motivou a criar este site. Assim, posso compartilhar esse material
              de forma acessível e ajudar ainda mais estudantes da área da
              saúde.
            </p>
            <p className="text-lg text-gray-500">
              A ideia é simples: você acessa o site e é direcionado diretamente
              para os meus resumos no Notion, onde tudo está organizado de forma
              prática e visual, ou para o Drive (que, além dos meus resumos em
              pdf, tem livros de grandes autores que eu conseguir reunir 🤭).
            </p>

            <p className="text-lg text-gray-500">
              Aqui, você também encontrará templates prontos no Notion para
              ajudar na organização dos seus estudos, tarefas, aulas, revisões e
              muito mais.
            </p>

            <p className="text-lg text-gray-500">
              Quero transformar este espaço em uma comunidade de estudantes da
              área da saúde para trocar conhecimento, colaborar e tornar o
              aprendizado mais acessível e eficiente.
            </p>

            <p className="text-lg text-gray-500">
              Se você tiver dúvidas, sugestões ou encontrar algo nos resumos que
              gostaria de discutir ou corrigir, entre em contato pelo e-mail
              (rafacastan.resumos@gmail.com) ou pelo meu Instagram (@rafa_epc_).
              Será um prazer conversar e trocar ideias!
            </p>

            <p className="text-lg text-gray-500">
              Manter esse projeto dá um trabalhinho extra, mas faço com carinho!
              Se, de alguma forma, te ajudei e você quiser contribuir para me
              motivar a continuar, criei um pix (rafacastan.resumos@gmail.com) e
              um ko-fi se quiser contribuir com o paypal ou cartão! Assim pode
              doar da forma que preferir, anônima ou não. Eu agradeceria
              muuuito, e isso ainda me ajudaria a pagar a faculdade!
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
