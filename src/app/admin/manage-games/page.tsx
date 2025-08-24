// src/app/admin/manage-games/page.tsx

import { kv } from '@vercel/kv';
import { Game } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ManageGamesList from '@/components/ManageGamesList'; // Criaremos este componente
import Link from 'next/link';

async function getAllGames() {
  const gameSlugs = await kv.smembers('games:all');
  const games = await Promise.all(
    gameSlugs.map(slug => kv.get<Game>(`game:${slug}`))
  );
  return games.filter((game): game is Game => game !== null).sort((a, b) => a.title.localeCompare(b.title));
}

export default async function ManageGamesPage() {
  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    redirect('/');
  }

  const games = await getAllGames();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Gerir Jogos</h1>
        <Link href="/admin/add-game" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md">
          + Adicionar Jogo
        </Link>
      </div>
      <ManageGamesList initialGames={games} />
    </div>
  );
}