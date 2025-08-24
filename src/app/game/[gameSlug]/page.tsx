// src/app/game/[gameSlug]/page.tsx

import { kv } from '@vercel/kv';
import { Game, GameReview } from '@/lib/types';
import { Clock, Star, User, PlusCircle, Edit, Award } from 'lucide-react'; // Adicione o ícone Award
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

async function getReviewsForGame(gameSlug: string): Promise<GameReview[]> {
  const reviewIds = await kv.lrange(`reviews_for_game:${gameSlug}`, 0, -1);
  if (!reviewIds || reviewIds.length === 0) {
    return [];
  }
  const reviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
  return reviews.filter((review): review is GameReview => review !== null).sort((a, b) => b.createdAt - a.createdAt);
}

async function getGameDetails(gameSlug: string): Promise<Game | null> {
  return await kv.get<Game>(`game:${gameSlug}`);
}

function ReviewCard({ review, currentUserId }: { review: GameReview, currentUserId?: string }) {
  const isOwner = review.userId === currentUserId;

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {review.userImage && <img src={review.userImage} alt={review.userName} className="w-8 h-8 rounded-full" />}
          <p className="font-bold text-lg">{review.userName}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-400">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
          {isOwner && (
            <Link href={`/review/${review.id}/edit`} className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors">
              <Edit size={16} />
              Editar
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 text-center">
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

  // --- LÓGICA PARA CALCULAR A PONTUAÇÃO GERAL ---
  let averageScore: string | null = null;
  if (reviews.length > 0) {
    const totalScore = reviews.reduce((sum, review) => sum + review.notaFinal, 0);
    averageScore = (totalScore / reviews.length).toFixed(1); // Arredonda para 1 casa decimal
  }
  // ------------------------------------------------

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-bold">{gameTitle}</h1>

        {/* --- NOVO COMPONENTE DE PONTUAÇÃO GERAL --- */}
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
        {/* ------------------------------------------- */}

      </div>

      {/* --- BOTÃO CONDICIONAL (continua igual) --- */}
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
      
      {/* A LISTA DE REVIEWS (continua igual) */}
      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review} currentUserId={currentUserId} />
          ))
        ) : (
          <p className="text-center text-slate-400 bg-slate-800 p-6 rounded-lg">Ainda não há nenhuma review para este jogo. Seja o primeiro!</p>
        )}
      </div>
    </div>
  );
}