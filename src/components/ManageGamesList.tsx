// src/components/ManageGamesList.tsx
'use client';

import { useState } from 'react';
import { Game } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ManageGamesList({ initialGames }: { initialGames: Game[] }) {
  const [games, setGames] = useState(initialGames);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (slug: string) => {
    if (!window.confirm('Apagar este jogo e todas as suas reviews PERMANENTEMENTE?')) return;

    const response = await fetch(`/api/games/${slug}`, { method: 'DELETE' });
    if (response.ok) {
      setGames(games.filter(g => g.slug !== slug));
      router.refresh();
    } else {
      const result = await response.json();
      setError(result.error || 'Falha ao apagar o jogo.');
    }
  };

  return (
    <div>
      {error && (
        <div style={{
          padding: '12px', marginBottom: '16px',
          border: '2px solid #ff4444', background: 'rgba(255,68,68,0.1)',
          fontFamily: "'VT323'", fontSize: '18px', color: '#ff4444',
        }}>
          ✗ {error}
        </div>
      )}

      {games.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', border: '2px solid #2a2a5a', background: '#0d0d1a' }}>
          <p style={{ fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#6060a0' }}>NENHUM JOGO CADASTRADO</p>
        </div>
      ) : (
        <div style={{ border: '2px solid #2a2a5a' }}>
          {games.map((game, i) => (
            <div key={game.slug} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '12px 16px', background: i % 2 === 0 ? '#0d0d1a' : '#12122a',
              borderBottom: '1px solid #1a1a3a',
            }}>
              {/* Cover thumbnail */}
              <div style={{
                width: '64px', height: '42px', flexShrink: 0,
                border: '1px solid #2a2a5a', background: '#0a0a18', overflow: 'hidden', position: 'relative',
              }}>
                {game.coverUrl ? (
                  <Image src={game.coverUrl} alt={game.title} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', color: '#2a2a5a',
                  }}>🎮</div>
                )}
              </div>

              {/* Game info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#00f5ff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {game.title}
                </p>
                <p style={{ fontFamily: "'VT323'", fontSize: '15px', color: '#6060a0', marginTop: '4px' }}>
                  /{game.slug}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                <Link href={`/admin/edit-game/${game.slug}`}
                  style={{ color: '#ffd700', transition: 'color 0.15s' }}
                  title="Editar">
                  <Edit size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(game.slug)}
                  style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                  title="Apagar">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}