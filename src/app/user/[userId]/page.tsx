// src/app/user/[userId]/page.tsx

import { kv } from '@/lib/kv';
import { GameReview } from '@/lib/types';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import UserProfileReviewList from '@/components/UserProfileReviewList';
import Image from 'next/image';
import { Game } from '@/lib/types';
import GameCard from '@/components/GameCard';

export const dynamic = 'force-dynamic';

async function getReviewsByUserId(userId: string, currentUserId?: string): Promise<GameReview[]> {
  const reviewIds = await kv.smembers(`user:${userId}:reviews`);
  if (!reviewIds || reviewIds.length === 0) {
    return [];
  }
  const rawReviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
  
  const reviews = await Promise.all(
    rawReviews.filter((r): r is GameReview => r !== null).map(async (review) => {
      const likesCount = await kv.scard(`review:${review.id}:likes`);
      let userLiked = false;
      if (currentUserId) {
        userLiked = (await kv.sismember(`review:${review.id}:likes`, currentUserId)) === 1;
      }
      return { ...review, likesCount, userLiked };
    })
  );

  return reviews.sort((a, b) => b.createdAt - a.createdAt);
}

async function getFavoriteGames(userId: string): Promise<(Game & { reviewCount: number; avgScore: number | null })[]> {
  const gameSlugs = await kv.smembers(`user:${userId}:favorites`);
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

  return games.filter((g): g is NonNullable<typeof g> => g !== null);
}

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.id !== userId) {
    notFound();
  }
  
  const userReviews = await getReviewsByUserId(userId, session.user.id);
  const favoriteGames = await getFavoriteGames(userId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        {session.user.image && (
            <Image 
                src={session.user.image} 
                alt="Avatar" 
                width={80} 
                height={80} 
                className="w-20 h-20 rounded-full border-4 border-slate-700" 
            />
        )}
        <div>
          <h1 className="text-4xl font-bold">{session.user.name}</h1>
          <p className="text-slate-400">Suas Reviews e Favoritos.</p>
        </div>
      </div>

      <div style={{ marginBottom: '48px' }}>
        <h2 className="pixel-font" style={{ fontSize: '10px', color: '#ffd700', marginBottom: '24px' }}>
          ▼ SEUS JOGOS FAVORITOS ({favoriteGames.length})
        </h2>
        {favoriteGames.length === 0 ? (
          <p style={{ fontFamily: "'VT323'", fontSize: '18px', color: '#6060a0' }}>
            Nenhum jogo favoritado. Vá explorar!
          </p>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px',
          }}>
            {favoriteGames.map(game => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="pixel-font" style={{ fontSize: '10px', color: '#00f5ff', marginBottom: '24px' }}>
          ▼ SUAS REVIEWS PUBLICADAS
        </h2>
        <UserProfileReviewList initialReviews={userReviews} />
      </div>
    </div>
  );
}