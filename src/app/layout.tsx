import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { NextAuthProvider } from "./providers"; // Importe o provedor
import AuthButtons from "@/components/AuthButtons"; // Componente de Login/Logout

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clube de Jogos",
  description: "Reviews de jogos dos seus amigos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-900 text-white`}>
        <NextAuthProvider> {/* Envolva com o provedor */}
          <nav className="border-b border-slate-700 bg-slate-800/50">
            <div className="container mx-auto flex justify-between items-center p-4">
              <Link href="/" className="text-2xl font-bold text-cyan-400 hover:text-cyan-300">
                Clube de Jogos
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/submit-review" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                  + Nova Review
                </Link>
                <AuthButtons /> {/* Adicione os botões de login/logout */}
              </div>
            </div>
          </nav>
          <main className="container mx-auto p-4 md:p-8">
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}