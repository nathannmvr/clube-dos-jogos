// src/app/user/[userId]/page.tsx

import { kv } from '@vercel/kv';
import { GameReview } from '@/lib/types';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import UserProfileReviewList from '@/components/UserProfileReviewList'; // Importe o novo componente

export const dynamic = 'force-dynamic';

async function getReviewsByUserId(userId: string): Promise<GameReview[]> {
  const reviewIds = await kv.smembers(`user:${userId}:reviews`);
  if (!reviewIds || reviewIds.length === 0) {
    return [];
  }
  const reviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
  return reviews.filter((review): review is GameReview => review !== null).sort((a, b) => b.createdAt - a.createdAt);
}

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);

  // Apenas o próprio utilizador pode ver a sua página de reviews
  if (!session || session.user.id !== params.userId) {
    notFound();
  }
  
  // Busca os dados iniciais no servidor
  const userReviews = await getReviewsByUserId(params.userId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        {session.user.image && <img src={session.user.image} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-slate-700" />}
        <div>
          <h1 className="text-4xl font-bold">{session.user.name}</h1>
          <p className="text-slate-400">Aqui estão todas as reviews que você já publicou.</p>
        </div>
      </div>

      {/* Renderiza o componente de cliente, passando os dados iniciais */}
      <UserProfileReviewList initialReviews={userReviews} />
    </div>
  );
}