// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { NextAuthProvider } from "./providers";
import AuthButtons from "@/components/AuthButtons";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clube de Jogos",
  description: "Reviews de jogos dos seus amigos",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = session?.user?.email ? adminEmails.includes(session.user.email) : false;

   return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-900 text-white`}>
        <NextAuthProvider>
          <nav className="border-b border-slate-700 bg-slate-800/50">
            <div className="container mx-auto flex justify-between items-center p-4">
              <Link href="/" className="text-2xl font-bold text-cyan-400 hover:text-cyan-300">
                Clube de Jogos
              </Link>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  // ALTERE ESTE LINK para a nova página
                  <Link href="/admin/manage-games" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-md">
                    Admin
                  </Link>
                )}
                <AuthButtons />
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