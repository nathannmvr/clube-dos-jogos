// src/app/game/[gameSlug]/page.tsx

import { kv } from '@vercel/kv';
// Importe o tipo 'Game' junto com 'GameReview'
import { Game, GameReview } from '@/lib/types';
import { Clock, Star, User, PlusCircle } from 'lucide-react';
import Link from 'next/link';
// Importe a função 'notFound' para lidar com jogos que não existem
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// A função que busca as reviews (continua igual)
async function getReviewsForGame(gameSlug: string): Promise<GameReview[]> {
  const reviewIds = await kv.lrange(`reviews_for_game:${gameSlug}`, 0, -1);
  if (!reviewIds || reviewIds.length === 0) {
    return [];
  }
  const reviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
  return reviews.filter((review): review is GameReview => review !== null);
}

// NOVA função que busca os detalhes principais do jogo
async function getGameDetails(gameSlug: string): Promise<Game | null> {
  // Busca o objeto do jogo diretamente pela chave 'game:[slug]'
  return await kv.get<Game>(`game:${gameSlug}`);
}

// O componente ReviewCard (continua igual)
function ReviewCard({ review }: { review: GameReview }) {
  // ... (nenhuma mudança aqui)
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


// O componente da página principal (MODIFICADO)
export default async function GamePage({ params }: { params: { gameSlug: string } }) {
  // Busca os dados do jogo e as reviews em paralelo para melhor performance
  const [game, reviews] = await Promise.all([
    getGameDetails(params.gameSlug),
    getReviewsForGame(params.gameSlug),
  ]);

  // Se o jogo não for encontrado no banco de dados, exibe uma página 404
  if (!game) {
    notFound();
  }

  // Agora, o título vem sempre da fonte correta (o objeto 'game')
  const gameTitle = game.title;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{gameTitle}</h1>
      </div>

      <div className="flex justify-center">
        <Link 
          href={`/game/${params.gameSlug}/submit-review`}
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-md transition-colors text-lg"
        >
          <PlusCircle size={24} />
          Adicionar sua Review
        </Link>
      </div>
      
      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <p className="text-center text-slate-400 bg-slate-800 p-6 rounded-lg">Ainda não há nenhuma review para este jogo. Seja o primeiro!</p>
        )}
      </div>
    </div>
  );
}