import Head from "next/head";
import Header from "~/components/header";

export default function About() {
  return (
    <>
      <Head>
        <title>Notion Pages</title>
        <meta name="description" content="View your Notion pages" />
      </Head>
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <Header />

          <div className="mx-auto mt-12 flex max-w-4xl flex-col gap-6">
            <p className="text-lg text-gray-600">
              Oiie! Meu nome é Rafaela Castan e aqui disponibilizo meus resumos,
              desenhos, apostilas e outros arquivos que fiz ou reuni ao longo
              dos meus estudos na PUCPR!
            </p>

            <p className="text-lg text-gray-600">
              Se encontrar algum erro, por favor, entre em contato pelo e-mail
              (rafacastan.resumos@gmail.com) ou pelo meu Instagram (@rafa_epc_).
            </p>

            <p className="text-lg text-gray-600">
              Fico à disposição e bons estudos! :D
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
