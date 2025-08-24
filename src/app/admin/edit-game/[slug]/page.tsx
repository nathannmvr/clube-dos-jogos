// src/app/admin/edit-game/[slug]/page.tsx

import { kv } from '@vercel/kv';
import { Game } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import EditGameForm from '@/components/EditGameForm';

async function getGame(slug: string): Promise<Game | null> {
  return await kv.get<Game>(`game:${slug}`);
}

export default async function EditGamePage({ params }: { params: { slug: string } }) {
  // --- LOGS PARA DEPURAÇÃO ---
  // Estes logs irão aparecer no seu terminal (onde corre o 'npm run dev')
  console.log("\n--- A ACEDER À PÁGINA DE EDIÇÃO DE JOGO ---");
  console.log("PARAMS RECEBIDOS PELA URL:", params);
  console.log("SLUG A SER PROCURADO NA BASE DE DADOS:", params.slug);
  // -------------------------

  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    redirect('/');
  }

  const game = await getGame(params.slug);

  // --- LOGS PARA DEPURAÇÃO ---
  console.log("RESULTADO DA BUSCA PELO JOGO NA BASE DE DADOS:", game);
  // -------------------------

  if (!game) {
    console.error("ERRO: Jogo não encontrado! A gerar página 404.");
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Editar Jogo</h1>
      <EditGameForm game={game} />
    </div>
  );
}