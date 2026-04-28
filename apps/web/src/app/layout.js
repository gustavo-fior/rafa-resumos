import { Inter, Lora } from "next/font/google";
import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";
import Footer from "@/components/footer";
const sans = Inter({
    variable: "--font-body",
    subsets: ["latin"],
});
const serif = Lora({
    variable: "--font-display",
    subsets: ["latin"],
});
export const metadata = {
    title: "Rafa Resumos",
    description: "Biblioteca digital para organizar e ler os resumos da Rafaela.",
};
export default function RootLayout({ children, }) {
    return (<html lang="pt-BR" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${sans.variable} ${serif.variable} min-h-svh overflow-x-hidden bg-neutral-50 text-[#37352f] antialiased`}>
        <Providers>
          <div className="grid min-h-svh grid-rows-[auto_1fr] bg-neutral-50">
            <Header />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>);
}
