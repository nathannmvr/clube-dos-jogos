// src/app/page.tsx

import { kv } from '@/lib/kv';
import Link from 'next/link';
import Image from 'next/image';
import { Game, GameReview } from '@/lib/types';
import HomeGameList from '@/components/HomeGameList';

async function getAllGames(): Promise<(Game & { reviewCount: number; avgScore: number | null })[]> {
  const gameSlugs = await kv.smembers('games:all');
  if (!gameSlugs || gameSlugs.length === 0) return [];

  const games = await Promise.all(
    gameSlugs.map(async (slug) => {
      const game = await kv.get<Game>(`game:${slug}`);
      if (!game) return null;

      const reviewIds = await kv.lrange<string>(`reviews_for_game:${slug}`, 0, -1);
      const reviewCount = reviewIds?.length ?? 0;

      let avgScore: number | null = null;
      if (reviewCount > 0) {
        const reviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
        const valid = reviews.filter((r): r is GameReview => r !== null);
        if (valid.length > 0) {
          const sum = valid.reduce((s, r) => s + r.notaFinal, 0);
          avgScore = parseFloat((sum / valid.length).toFixed(1));
        }
      }

      return { ...game, reviewCount, avgScore };
    })
  );

  return games
    .filter((g): g is Game & { reviewCount: number; avgScore: number | null } => g !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default async function HomePage() {
  const gamesPromise = getAllGames();
  const categoriesPromise = kv.smembers('categories:all');
  const [games, categoriesRaw] = await Promise.all([gamesPromise, categoriesPromise]);
  const allCategories = (categoriesRaw || []).filter((c): c is string => typeof c === 'string').sort();

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 className="pixel-font" style={{ fontSize: '14px', marginBottom: '20px', lineHeight: '2' }}>
          <span className="neon-green">JOGOS</span>{' '}
          <span className="neon-cyan">DO CLUBE</span>
        </h1>
        <p style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#6060a0' }}>
          SELECIONE UM JOGO PARA VER AS REVIEWS
          <span className="blink"> █</span>
        </p>
      </div>

      {/* GAME GRID & FILTERS */}
      {games.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 32px',
          border: '2px solid #2a2a5a', background: '#0d0d1a',
        }}>
          <p style={{ fontFamily: "'Press Start 2P'", fontSize: '10px', color: '#6060a0' }}>
            NENHUM JOGO CADASTRADO
          </p>
          <p style={{ fontFamily: "'VT323'", fontSize: '20px', color: '#39ff14', marginTop: '16px' }}>
            Um administrador deve adicionar jogos primeiro.
          </p>
        </div>
      ) : (
        <HomeGameList games={games} allCategories={allCategories} />
      )}
    </div>
  );
}