import type { Metadata } from "next";
import { Instagram, Linkedin } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre — Rafa Resumos",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 pt-6 md:px-0">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-(family-name:--font-display) text-xl font-semibold text-[#37352f]">
          Sobre
        </h1>
        <Link
          href="https://www.linkedin.com/in/rafaela-castan-7a43ab2bb/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className="text-[#9b9a97] transition-colors hover:text-[#37352f]"
        >
          <Linkedin className="size-5" />
        </Link>
      </div>

      <div className="space-y-5 text-[15px] leading-relaxed text-[#37352f]">
        <p>
          Oiie! Meu nome é Rafaela Castan e aqui disponibilizo meus resumos,
          desenhos, apostilas e outros arquivos que fiz ou reuni ao longo dos
          meus estudos na PUCPR!
        </p>

        <p>
          Durante meus estudos, percebi que resumos bem organizados, com imagens
          e desenhos, me ajudavam muito a entender as matérias. Além disso,
          muitos colegas começaram a pedir meus resumos, o que me motivou a
          criar este site. Assim, posso compartilhar esse material de forma
          acessível e ajudar ainda mais estudantes da área da saúde.
        </p>

        <p>
          A ideia é simples: você acessa o site e é direcionado diretamente para
          os meus resumos, onde tudo está organizado de forma prática e visual.
        </p>

        <p>
          Aqui, você também encontrará templates prontos no Notion para ajudar
          na organização dos seus estudos, tarefas, aulas, revisões e muito
          mais.
        </p>

        <p>
          Quero transformar este espaço em uma comunidade de estudantes da área
          da saúde para trocar conhecimento, colaborar e tornar o aprendizado
          mais acessível e eficiente.
        </p>

        <p>
          Se você tiver dúvidas, sugestões ou encontrar algo nos resumos que
          gostaria de discutir ou corrigir, entre em contato pelo e-mail (
          <Link
            href="mailto:rafacastan.resumos@gmail.com"
            className="underline decoration-[#9b9a97] underline-offset-[3px] transition-colors hover:decoration-[#37352f]"
          >
            rafacastan.resumos@gmail.com
          </Link>
          ) ou pelo meu Instagram (
          <Link
            href="https://www.instagram.com/rafa_epc_"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-[#9b9a97] underline-offset-[3px] transition-colors hover:decoration-[#37352f]"
          >
            @rafa_epc_
          </Link>
          ). Será um prazer conversar e trocar ideias!
        </p>

        <p>
          Manter esse projeto dá um trabalhinho extra, mas faço com carinho! Se,
          de alguma forma, te ajudei e você quiser contribuir para me motivar a
          continuar, criei um pix (rafacastan.resumos@gmail.com) e um ko-fi se
          quiser contribuir com o paypal ou cartão! Assim pode doar da forma que
          preferir, anônima ou não. Eu agradeceria muuuito, e isso ainda me
          ajudaria a pagar a faculdade!
        </p>

        <p>Fico à disposição e bons estudos! :)</p>
      </div>
    </main>
  );
}
