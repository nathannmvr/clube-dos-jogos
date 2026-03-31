// src/app/page.tsx

import { kv } from '@/lib/kv';
import Link from 'next/link';
import Image from 'next/image';
import { Game, GameReview } from '@/lib/types';

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
  const games = await getAllGames();

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

      {/* GAME GRID */}
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '24px',
        }}>
          {games.map((game) => (
            <Link key={game.slug} href={`/game/${game.slug}`} style={{ textDecoration: 'none' }}>
              <div className="game-card pixel-card" style={{
                cursor: 'pointer',
                overflow: 'hidden',
              }}>
                {/* Cover Image */}
                <div style={{
                  width: '100%', height: '160px', position: 'relative',
                  background: '#08081a', overflow: 'hidden',
                }}>
                  {game.coverUrl ? (
                    <Image
                      src={game.coverUrl}
                      alt={game.title}
                      fill
                      style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #0d0d28, #1a0a2e)',
                    }}>
                      <span style={{ fontSize: '48px' }}>🎮</span>
                      <span style={{
                        fontFamily: "'Press Start 2P'", fontSize: '7px',
                        color: '#2a2a5a', marginTop: '8px',
                      }}>SEM CAPA</span>
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: '60px',
                    background: 'linear-gradient(transparent, rgba(10,10,18,0.9))',
                  }} />
                </div>

                {/* Info */}
                <div style={{ padding: '16px' }}>
                  <p className="pixel-font" style={{
                    fontSize: '8px', color: '#00f5ff',
                    marginBottom: '10px', lineHeight: '1.8',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {game.title}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    {/* Average score badge */}
                    {game.avgScore !== null ? (
                      <div style={{
                        fontFamily: "'Press Start 2P'", fontSize: '9px', padding: '3px 7px',
                        background: game.avgScore >= 8 ? 'rgba(57,255,20,0.15)' : game.avgScore >= 6 ? 'rgba(255,215,0,0.15)' : 'rgba(255,68,68,0.15)',
                        border: `1px solid ${game.avgScore >= 8 ? '#39ff14' : game.avgScore >= 6 ? '#ffd700' : '#ff4444'}`,
                        color: game.avgScore >= 8 ? '#39ff14' : game.avgScore >= 6 ? '#ffd700' : '#ff4444',
                        flexShrink: 0,
                      }}>
                        {game.avgScore}
                      </div>
                    ) : null}
                    <span style={{
                      fontFamily: "'VT323'", fontSize: '16px',
                      color: game.reviewCount > 0 ? '#39ff14' : '#6060a0',
                      flex: 1,
                    }}>
                      {game.reviewCount > 0 ? `★ ${game.reviewCount} REVIEW${game.reviewCount > 1 ? 'S' : ''}` : 'SEM REVIEWS'}
                    </span>
                    <span className="neon-green" style={{ fontFamily: "'VT323'", fontSize: '18px' }}>▶</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}