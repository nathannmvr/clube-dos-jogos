// src/app/game/[gameSlug]/page.tsx

import { kv } from '@/lib/kv';
import { Game, GameReview } from '@/lib/types';
import { PlusCircle, Edit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notFound } from 'next/navigation';
import ReviewList from '@/components/ReviewList';
import FavoriteButton from '@/components/FavoriteButton';

async function getGameDetails(slug: string): Promise<Game | null> {
  return await kv.get<Game>(`game:${slug}`);
}

async function getReviewsForGame(slug: string, currentUserId?: string): Promise<GameReview[]> {
  const reviewIds = await kv.lrange<string>(`reviews_for_game:${slug}`, 0, -1);
  if (!reviewIds || reviewIds.length === 0) return [];
  const rawReviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
  
  const reviews = await Promise.all(
    rawReviews.filter((r): r is GameReview => r !== null).map(async (review) => {
      const likesCount = await kv.scard(`review:${review.id}:likes`);
      let userLiked = false;
      if (currentUserId) {
         const liked = await kv.sismember(`review:${review.id}:likes`, currentUserId);
         userLiked = liked === 1;
      }
      return { ...review, likesCount, userLiked };
    })
  );

  return reviews.sort((a, b) => b.createdAt - a.createdAt);
}

function getScoreClass(score: number) {
  if (score >= 8) return 'score-green';
  if (score >= 6) return 'score-yellow';
  return 'score-red';
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  const color = value >= 8 ? '#39ff14' : value >= 6 ? '#ffd700' : '#ff4444';
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontFamily: "'VT323'", fontSize: '15px', color: '#a0a0d0' }}>{label}</span>
        <span style={{ fontFamily: "'VT323'", fontSize: '15px', color }}>{value}/10</span>
      </div>
      <div style={{ height: '6px', background: '#1a1a3a', border: '1px solid #2a2a5a' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default async function GamePage({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const [game, reviews] = await Promise.all([
    getGameDetails(gameSlug),
    getReviewsForGame(gameSlug, currentUserId),
  ]);

  if (!game) notFound();

  const userReview = reviews.find(r => r.userId === currentUserId);

  let initialIsFavorite = false;
  if (currentUserId) {
    const isFavorited = await kv.sismember(`user:${currentUserId}:favorites`, gameSlug);
    initialIsFavorite = isFavorited === 1;
  }

  // Compute aggregate scores
  let averageScore: string | null = null;
  const avgScores: Record<string, number> = {};
  if (reviews.length > 0) {
    const total = reviews.reduce((s, r) => s + r.notaFinal, 0);
    averageScore = (total / reviews.length).toFixed(1);

    const scoreKeys = ['jogabilidade', 'arte', 'trilhaSonora', 'diversao', 'rejogabilidade', 'graficos', 'complexidade', 'lore'];
    for (const key of scoreKeys) {
      const sum = reviews.reduce((s, r) => s + ((r.scores as Record<string, number>)[key] || 0), 0);
      avgScores[key] = parseFloat((sum / reviews.length).toFixed(1));
    }
  }

  const scoreLabels: Record<string, string> = {
    jogabilidade: 'Jogabilidade', arte: 'Arte', trilhaSonora: 'Trilha Sonora',
    diversao: 'Diversão', rejogabilidade: 'Rejogabilidade', graficos: 'Gráficos',
    complexidade: 'Complexidade', lore: 'Lore',
  };

  const numScore = averageScore ? parseFloat(averageScore) : null;

  return (
    <div>
      {/* ============================================================
          HERO CARD — Metacritic Style (Background Image Layout)
          ============================================================ */}
      <div className="pixel-card" style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        marginBottom: '48px', overflow: 'hidden',
        minHeight: '400px',
      }}>
        {/* Background Layer */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
          background: '#0d0d28'
        }}>
          {game.coverUrl ? (
            <Image
              src={game.coverUrl}
              alt={game.title}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              priority
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #0d0d28, #1a0a2e)',
            }}>
              <span style={{ fontSize: '64px' }}>🎮</span>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#2a2a5a', marginTop: '12px' }}>SEM CAPA</span>
            </div>
          )}
          {/* Semi-transparent Overlay to make text legible */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(18, 18, 42, 0.85)',
            backdropFilter: 'blur(4px)',
          }} />
        </div>

        {/* Content Wrapper */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Info Panel */}
          <div style={{ padding: '32px', flex: 1 }}>
            {/* Title */}
            <h1 className="pixel-font" style={{ fontSize: '12px', color: '#00f5ff', marginBottom: '24px', lineHeight: '2', textShadow: '2px 2px 0px #000' }}>
              {game.title}
            </h1>

            {/* Score + review count */}
            {averageScore && numScore !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div className={`${getScoreClass(numScore)}`} style={{
                  width: '72px', height: '72px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Press Start 2P'", flexShrink: 0,
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
                }}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>{averageScore}</span>
                  <span style={{ fontSize: '7px', marginTop: '4px', opacity: 0.7 }}>/10</span>
                </div>
                <div>
                  <p style={{ fontFamily: "'VT323'", fontSize: '22px', color: '#a0a0d0', textShadow: '1px 1px 0px #000' }}>
                    NOTA MÉDIA
                  </p>
                  <p style={{ fontFamily: "'VT323'", fontSize: '18px', color: '#e0e0ff', textShadow: '1px 1px 0px #000' }}>
                    baseada em <span style={{ color: '#ffd700' }}>{reviews.length}</span> review{reviews.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#a0a0d0', textShadow: '1px 1px 0px #000' }}>
                  SEM REVIEWS AINDA
                </p>
              </div>
            )}

            {/* Category score bars */}
            {reviews.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                {Object.entries(avgScores).map(([key, val]) => (
                  <ScoreBar key={key} label={scoreLabels[key]} value={val} />
                ))}
              </div>
            )}

            {/* Recent reviewers carousel */}
            {reviews.length > 0 && (
              <div style={{
                borderTop: '1px solid rgba(42, 42, 90, 0.5)', paddingTop: '16px',
                fontFamily: "'VT323'", fontSize: '16px', color: '#e0e0e0',
              }}>
                <p style={{ marginBottom: '8px', color: '#a0a0d0', textShadow: '1px 1px 0px #000' }}>AVALIADO POR:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {reviews.slice(0, 5).map(r => (
                    <div key={r.id} title={r.userName} style={{
                      padding: '4px 10px', background: 'rgba(26, 26, 58, 0.8)',
                      border: '1px solid #2a2a5a', color: '#00f5ff', fontSize: '16px',
                    }}>
                      {r.userName.split(' ')[0]}
                    </div>
                  ))}
                  {reviews.length > 5 && (
                    <div style={{ padding: '4px 10px', background: 'rgba(26, 26, 58, 0.8)', border: '1px solid #2a2a5a', color: '#a0a0d0' }}>
                      +{reviews.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          {session?.user && (
            <div style={{
              padding: '16px 32px', background: 'rgba(13, 13, 26, 0.6)',
              borderTop: '2px solid rgba(42, 42, 90, 0.5)',
              display: 'flex', gap: '16px', alignItems: 'center',
              backdropFilter: 'blur(8px)',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {!userReview ? (
                  <Link href={`/game/${gameSlug}/submit-review`}>
                    <button className="btn-pixel btn-pixel-cyan" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px' }}>
                      <PlusCircle size={14} /> ADICIONAR REVIEW
                    </button>
                  </Link>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontFamily: "'VT323'", fontSize: '18px', color: '#39ff14', textShadow: '1px 1px 0px #000' }}>
                      ★ Sua review: <strong>{userReview.notaFinal}/10</strong>
                    </span>
                    <Link href={`/review/${userReview.id}/edit`}>
                      <button className="btn-pixel btn-pixel-yellow" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8px' }}>
                        <Edit size={12} /> EDITAR
                      </button>
                    </Link>
                  </div>
                )}
              </div>
              <FavoriteButton gameSlug={gameSlug} initialIsFavorite={initialIsFavorite} />
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          REVIEWS SECTION
          ============================================================ */}
      <div>
        <h2 className="pixel-font" style={{ fontSize: '10px', color: '#ffd700', marginBottom: '24px' }}>
          ▼ REVIEWS DOS MEMBROS
        </h2>
        <ReviewList initialReviews={reviews} currentUserId={currentUserId} />
      </div>
    </div>
  );
}