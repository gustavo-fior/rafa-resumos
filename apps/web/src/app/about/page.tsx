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
          Olá estudante da área da saúde!
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
          Meu nome é Rafaela Eloísa Portela Castan, sou estudante de medicina na
          PUCPR da turma 94, aqui disponibilizo meus resumos, desenhos,
          apostilas e outros arquivos que fiz ou reuni ao longo dos meus
          estudos!
        </p>

        <p>
          Durante meus estudos, percebi que resumos bem organizados, com imagens
          e desenhos, me ajudavam muito a entender as matérias. Além disso,
          muitos colegas começaram a pedir meus resumos, o que me motivou a
          criar este site. Assim, posso compartilhar esse material de forma
          acessível e ajudar ainda mais estudantes da área da saúde.
        </p>

        <p>
          Agora, em 2026, me tornei monitora da disciplina Aspectos Estruturais
          e Funcionais do Tecido Humano e Biologia Celular. Aqui também estão
          reunidos meus resumos das aulas relacionadas a essa disciplina, que
          incluem Biologia Celular, Início da Vida e Histologia. Ao longo do
          semestre, vou disponibilizar mais conteúdos com base nas aulas. Se
          você estiver fazendo a monitoria comigo, encontrará o material
          completo nessas pastas.
        </p>

        <p>
          O site já está ativo há um ano, sempre fizemos com muito carinho,
          mesmo dando um trabalhinho extra, e até então era de forma gratuita.
          Fico muito feliz em saber que ajudou pessoas nesse tempo. Mas, por
          condições financeiras da minha família, decidimos começar a cobrar
          para me ajudar a pagar a faculdade.
        </p>

        <p>
          O primeiro conteúdo de cada matéria continuará gratuito. Assim, você
          consegue ter uma ideia de como são meus resumos de cada disciplina, de
          umas ajudas que vão ser gratuitos também :)
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
      </div>
    </main>
  );
}
