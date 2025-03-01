import { GeistSans } from "geist/font/sans";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Rafa Resumos</title>
        <meta name="description" content="Rafa Resumos" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Analytics />
      <div className={GeistSans.className}>
        <Component {...pageProps} />
      </div>
    </>
  );
};

export default api.withTRPC(MyApp);
