// src/app/review/[reviewId]/edit/page.tsx

import { kv } from '@vercel/kv';
import { redirect } from 'next/navigation'; // Removido o 'notFound'
import { GameReview } from '@/lib/types';
import ReviewForm from '@/components/ReviewForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function getReviewById(reviewId: string): Promise<GameReview | null> {
    return await kv.get<GameReview>(`review:${reviewId}`);
}

export default async function EditReviewPage({ params }: { params: { reviewId: string } }) {
  const session = await getServerSession(authOptions);
  const review = await getReviewById(params.reviewId);

  if (!review || !session?.user || session.user.id !== review.userId) {
    redirect('/');
  }

  return (
    <div>
      <ReviewForm
        game={{ title: review.gameTitle, slug: review.gameSlug }}
        existingReview={review}
      />
    </div>
  );
}