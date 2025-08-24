// src/app/game/[gameSlug]/page.tsx

import { kv } from '@vercel/kv';
import { Game, GameReview } from '@/lib/types';
import { PlusCircle, Edit, Award } from 'lucide-react'; // 'User' e 'Clock' removidos
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ReviewList from '@/components/ReviewList';

export const dynamic = 'force-dynamic';

async function getReviewsForGame(gameSlug: string): Promise<GameReview[]> {
  const reviewIds = await kv.lrange(`reviews_for_game:${gameSlug}`, 0, -1);
  if (!reviewIds || reviewIds.length === 0) return [];
  
  const reviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
  return reviews.filter((review): review is GameReview => review !== null).sort((a, b) => b.createdAt - a.createdAt);
}

async function getGameDetails(gameSlug: string): Promise<Game | null> {
  return await kv.get<Game>(`game:${gameSlug}`);
}

// A definição do componente 'ReviewCard' foi REMOVIDA daqui, pois agora vive em ReviewList.tsx

export default async function GamePage({ params }: { params: { gameSlug: string } }) {
  const [session, game, reviews] = await Promise.all([
    getServerSession(authOptions),
    getGameDetails(params.gameSlug),
    getReviewsForGame(params.gameSlug),
  ]);

  if (!game) {
    notFound();
  }
  
  const currentUserId = session?.user?.id;
  const gameTitle = game.title;
  const userReview = reviews.find(review => review.userId === currentUserId);

  let averageScore: string | null = null;
  if (reviews.length > 0) {
    const totalScore = reviews.reduce((sum, review) => sum + review.notaFinal, 0);
    averageScore = (totalScore / reviews.length).toFixed(1);
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-bold">{gameTitle}</h1>
        <div className="mt-4 flex justify-center items-center">
          {averageScore ? (
            <div className="flex items-center gap-3 bg-amber-500/10 text-amber-300 px-4 py-2 rounded-full">
              <Award size={28} />
              <div>
                <span className="font-bold text-2xl">{averageScore}</span>
                <span className="text-sm"> / 10</span>
                <p className="text-xs text-amber-400/70">Pontuação Geral ({reviews.length} {reviews.length > 1 ? 'avaliações' : 'avaliação'})</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 mt-2">Este jogo ainda não tem uma pontuação geral.</p>
          )}
        </div>
      </div>

      {session?.user && (
        <div className="flex justify-center">
          {!userReview ? (
            <Link 
              href={`/game/${params.gameSlug}/submit-review`}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-md transition-colors text-lg"
            >
              <PlusCircle size={24} />
              Adicionar sua Review
            </Link>
          ) : (
            <div className="text-center bg-slate-800 border border-slate-700 p-4 rounded-lg">
              <p className="text-slate-300 mb-2">Você já avaliou este jogo.</p>
              <Link 
                href={`/review/${userReview.id}/edit`}
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold"
              >
                <Edit size={16} />
                Editar minha Review
              </Link>
            </div>
          )}
        </div>
      )}
      
      <ReviewList initialReviews={reviews} currentUserId={currentUserId} />
    </div>
  );
}