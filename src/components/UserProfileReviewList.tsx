// src/components/UserProfileReviewList.tsx
'use client';

import { useState } from 'react';
import { GameReview } from '@/lib/types';
import Link from 'next/link';
import { Clock, Star, Edit, Trash2, Gamepad2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// O card de review específico para a página de perfil
function UserReviewCard({ review, onDelete }: { review: GameReview, onDelete: (reviewId: string) => void }) {
  const handleDelete = () => {
    if (window.confirm("Tem a certeza que quer apagar esta review permanentemente?")) {
      onDelete(review.id);
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 w-full">
      <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-3">
        <p className="text-sm text-slate-400">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
        <div className="flex items-center gap-4">
          <Link href={`/review/${review.id}/edit`} className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors" title="Editar">
            <Edit size={16} />
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400 transition-colors" title="Apagar">
            <Trash2 size={16} />
          </button>
        </div>
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


export default function UserProfileReviewList({ initialReviews }: { initialReviews: GameReview[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDeleteReview = async (reviewId: string) => {
    setError(null);
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setReviews(currentReviews => currentReviews.filter(r => r.id !== reviewId));
      router.refresh();
    } else {
      const result = await response.json();
      setError(result.error || 'Não foi possível apagar a review.');
    }
  };

  // Agrupa as reviews por jogo, como na página original
  const reviewsByGame = reviews.reduce((acc, review) => {
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

  if (reviews.length === 0) {
    return (
        <div className="text-center bg-slate-800 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Nenhuma Review Encontrada</h2>
            <p className="text-slate-300">Você ainda não publicou nenhuma review.</p>
            <Link href="/" className="mt-6 inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md">
                Ver Jogos
            </Link>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-red-400 bg-red-900/50 p-4 text-center rounded-lg">{error}</p>}
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
              <UserReviewCard key={review.id} review={review} onDelete={handleDeleteReview} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}