// src/app/layout.tsx

import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { NextAuthProvider } from "./providers";
import AuthButtons from "@/components/AuthButtons";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Clube dos Jogos — Reviews 8-Bit",
  description: "Reviews de jogos dos seus amigos, estilo retro 8-bit",
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
    <html lang="pt-BR" className={pressStart2P.variable}>
      <body>
        <NextAuthProvider>
          {/* NAVBAR */}
          <nav style={{
            borderBottom: '4px solid #39ff14',
            background: 'linear-gradient(180deg, #08081a 0%, #0a0a12 100%)',
            boxShadow: '0 4px 20px rgba(57,255,20,0.2)',
            position: 'relative',
            zIndex: 100,
          }}>
            <div className="container mx-auto flex justify-between items-center px-4 py-3">
              {/* Logo */}
              <Link href="/" style={{ textDecoration: 'none' }}>
                <span className="pixel-font neon-green" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                  ▶ CLUBE<br />
                  <span style={{ marginLeft: '16px' }}>DOS JOGOS</span>
                </span>
              </Link>

              {/* Nav items */}
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link href="/admin/manage-games">
                    <span className="btn-pixel btn-pixel-yellow" style={{ fontSize: '8px' }}>
                      ★ ADMIN
                    </span>
                  </Link>
                )}
                <AuthButtons />
              </div>
            </div>
          </nav>

          {/* MAIN */}
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>

          {/* FOOTER */}
          <footer style={{
            borderTop: '2px solid #2a2a5a',
            padding: '24px',
            textAlign: 'center',
            color: '#6060a0',
            fontFamily: "'VT323', monospace",
            fontSize: '16px',
            marginTop: '48px',
          }}>
            INSERT COIN TO CONTINUE <span className="blink">█</span>
            <br />
            <span style={{ fontSize: '13px' }}>© {new Date().getFullYear()} CLUBE DOS JOGOS</span>
          </footer>
        </NextAuthProvider>
      </body>
    </html>
  );
}