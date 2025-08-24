// src/components/ReviewList.tsx
'use client';

import { useState } from 'react';
import { GameReview } from '@/lib/types';
import Link from 'next/link';
import { Clock, Star, User, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function ReviewCard({ review, currentUserId, onDelete }: { review: GameReview, currentUserId?: string, onDelete: (reviewId: string) => void }) {
  const isOwner = review.userId === currentUserId;

  const handleDelete = () => {
    if (window.confirm("Tem a certeza que quer apagar esta review permanentemente?")) {
      onDelete(review.id);
    }
  };

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
            <>
              <Link href={`/review/${review.id}/edit`} className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors" title="Editar">
                <Edit size={16} />
              </Link>
              <button onClick={handleDelete} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400 transition-colors" title="Apagar">
                <Trash2 size={16} />
              </button>
            </>
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

export default function ReviewList({ initialReviews, currentUserId }: { initialReviews: GameReview[], currentUserId?: string }) {
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

  return (
    <div className="space-y-6">
      {error && <p className="text-red-400 bg-red-900/50 p-4 text-center rounded-lg">{error}</p>}
      {reviews.length > 0 ? (
        reviews.map(review => (
          <ReviewCard key={review.id} review={review} currentUserId={currentUserId} onDelete={handleDeleteReview} />
        ))
      ) : (
        <p className="text-center text-slate-400 bg-slate-800 p-6 rounded-lg">Ainda não há nenhuma review para este jogo. Seja o primeiro!</p>
      )}
    </div>
  );
}