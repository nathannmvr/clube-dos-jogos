import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/lib/types';

export default function GameCard({ game }: { game: Game & { reviewCount?: number; avgScore?: number | null } }) {
  return (
    <Link href={`/game/${game.slug}`} style={{ textDecoration: 'none' }}>
      <div className="game-card pixel-card" style={{
        cursor: 'pointer',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Cover Image */}
        <div style={{
          width: '100%', height: '160px', position: 'relative',
          background: '#08081a', overflow: 'hidden', flexShrink: 0
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
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p className="pixel-font" style={{
            fontSize: '8px', color: '#00f5ff',
            marginBottom: '10px', lineHeight: '1.8',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {game.title}
          </p>

          {/* Categories tag display */}
          {game.categories && game.categories.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {game.categories.slice(0, 3).map(cat => (
                <span key={cat} style={{
                  fontSize: '9px', fontFamily: "'VT323'", padding: '2px 6px',
                  background: 'rgba(57, 255, 20, 0.1)', border: '1px solid #39ff14', color: '#39ff14'
                }}>
                  {cat}
                </span>
              ))}
              {game.categories.length > 3 && (
                <span style={{ fontSize: '9px', fontFamily: "'VT323'", padding: '2px 6px', color: '#6060a0' }}>+{game.categories.length - 3}</span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
            {/* Average score badge */}
            {game.avgScore !== null && game.avgScore !== undefined ? (
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
              color: (game.reviewCount ?? 0) > 0 ? '#39ff14' : '#6060a0',
              flex: 1,
            }}>
              {(game.reviewCount ?? 0) > 0 ? `★ ${game.reviewCount} REVIEW${(game.reviewCount ?? 0) > 1 ? 'S' : ''}` : 'SEM REVIEWS'}
            </span>
            <span className="neon-green" style={{ fontFamily: "'VT323'", fontSize: '18px' }}>▶</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
