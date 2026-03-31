// src/app/admin/manage-games/page.tsx

import { kv } from '@/lib/kv';
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="pixel-font" style={{ fontSize: '10px', color: '#00f5ff' }}>
          ▼ GERENCIAR ACERVO DE JOGOS
        </h2>
        <Link href="/admin/add-game" style={{ textDecoration: 'none' }}>
          <span className="btn-pixel btn-pixel-green" style={{ fontSize: '8px', padding: '10px 16px' }}>
            + ADICIONAR JOGO
          </span>
        </Link>
      </div>
      <ManageGamesList initialGames={games} />
    </div>
  );
}