// src/app/user/[userId]/page.tsx

import { kv } from '@vercel/kv';
import { GameReview } from '@/lib/types';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Clock, Star, Edit, Gamepad2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getReviewsByUserId(userId: string): Promise<GameReview[]> {
  // Busca todos os IDs de review do set do utilizador
  const reviewIds = await kv.smembers(`user:${userId}:reviews`);
  if (!reviewIds || reviewIds.length === 0) {
    return [];
  }
  // Busca os detalhes de todas as reviews de uma só vez
  const reviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
  // Filtra possíveis reviews nulas e ordena pelas mais recentes
  return reviews.filter((review): review is GameReview => review !== null).sort((a, b) => b.createdAt - a.createdAt);
}

// Um card de review simplificado, específico para esta página
function UserReviewCard({ review }: { review: GameReview }) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 w-full">
      <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-3">
          <p className="text-sm text-slate-400">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
          <Link href={`/review/${review.id}/edit`} className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors">
              <Edit size={16} />
              Editar
          </Link>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2" title="Horas Jogadas">
          <Clock className="w-5 h-5 text-slate-400" />
          <span className="font-semibold">{review.horasJogadas}h</span>
        </div>
        <div className="flex items-center gap-2 bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full" title="Sua Nota Final">
          <Star className="w-5 h-5" />
          <span className="font-bold text-lg">{review.notaFinal}/10</span>
        </div>
      </div>
    </div>
  );
}

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const [session, userReviews] = await Promise.all([
    getServerSession(authOptions),
    getReviewsByUserId(params.userId),
  ]);

  console.log("ID do utilizador na URL (params):", params.userId);
  console.log("Sessão do utilizador encontrada:", session ? "Sim" : "Não");
  if (session && session.user) {
    console.log("ID do utilizador na Sessão:", session.user.id);
    console.log("IDs são iguais?:", session.user.id === params.userId);
  }

  // Apenas o próprio utilizador pode ver a sua página de reviews
  if (!session || session.user.id !== params.userId) {
    notFound();
  }

  // Agrupa as reviews por jogo
  const reviewsByGame = userReviews.reduce((acc, review) => {
    const key = review.gameSlug;
    if (!acc[key]) {
      acc[key] = {
        title: review.gameTitle,
        slug: review.gameSlug,
        reviews: [],
      };
    }
    acc[key].reviews.push(review);
    return acc;
  }, {} as Record<string, { title: string, slug: string, reviews: GameReview[] }>);

  const groupedReviews = Object.values(reviewsByGame);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        {session.user.image && <img src={session.user.image} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-slate-700" />}
        <div>
          <h1 className="text-4xl font-bold">{session.user.name}</h1>
          <p className="text-slate-400">Aqui estão todas as reviews que você já publicou.</p>
        </div>
      </div>

      {groupedReviews.length > 0 ? (
        <div className="space-y-8">
          {groupedReviews.map(game => (
            <div key={game.slug}>
              <Link href={`/game/${game.slug}`} className="group">
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-3 group-hover:text-cyan-400 transition-colors">
                  <Gamepad2 size={28} />
                  {game.title}
                </h2>
              </Link>
              <div className="flex flex-col gap-4">
                {game.reviews.map(review => (
                  <UserReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-slate-800 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Nenhuma Review Encontrada</h2>
            <p className="text-slate-300">Você ainda não publicou nenhuma review.</p>
            <Link href="/" className="mt-6 inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md">
                Ver Jogos
            </Link>
        </div>
      )}
    </div>
  );
}