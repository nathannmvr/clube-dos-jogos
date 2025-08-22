// src/app/game/[gameSlug]/page.tsx

import { kv } from '@vercel/kv';
import { GameReview } from '@/lib/types';
import { Clock, Star, User } from 'lucide-react';

async function getReviewsForGame(gameSlug: string): Promise<GameReview[]> {
  const reviewIds = await kv.lrange(`reviews_for_game:${gameSlug}`, 0, -1);
  if (!reviewIds || reviewIds.length === 0) {
    return [];
  }
  const reviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
  return reviews.filter((review): review is GameReview => review !== null);
}

// Componente para exibir um único card de review
function ReviewCard({ review }: { review: GameReview }) {
  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          <p className="font-bold text-lg">{review.userName}</p>
        </div>
        <p className="text-sm text-slate-400">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-center">
        {/* ADICIONE A VERIFICAÇÃO AQUI 👇 */}
        {review.scores && Object.entries(review.scores).map(([key, value]) => (
          <div key={key} className="bg-slate-900/50 p-2 rounded-md">
            <p className="text-xs capitalize text-slate-300">{key.replace('trilhaSonora', 'Trilha')}</p>
            <p className="font-bold text-lg text-cyan-400">{value}/10</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center border-t border-slate-700 pt-4 mt-4">
        <div className="flex items-center gap-2" title="Horas Jogadas">
          <Clock className="w-5 h-5 text-slate-400" />
          <span className="font-semibold">{review.horasJogadas}h</span>
        </div>
        <div className="flex items-center gap-2 bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full" title="Nota Final">
          <Star className="w-5 h-5" />
          <span className="font-bold text-lg">{review.notaFinal}/10</span>
        </div>
      </div>
    </div>
  );
}


export default async function GamePage({ params }: { params: { gameSlug: string } }) {
  const reviews = await getReviewsForGame(params.gameSlug);

  if (reviews.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold">Jogo não encontrado</h1>
        <p className="text-slate-400 mt-4">Nenhuma review foi encontrada para este jogo.</p>
      </div>
    );
  }

  const gameTitle = reviews[0].gameTitle;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">{gameTitle}</h1>
      <div className="space-y-6">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

// Opcional: Melhora o desempenho em produção
export async function generateStaticParams() {
    const gameSlugs = await kv.smembers('games:reviewed');
    return gameSlugs.map((gameSlug) => ({
      gameSlug,
    }));
}