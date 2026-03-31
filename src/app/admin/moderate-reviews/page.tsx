import { kv } from '@/lib/kv';
import { GameReview } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ModerateReviewsList from '@/components/ModerateReviewsList';

export const dynamic = 'force-dynamic';

async function getAllReviews() {
  // 1. Fetch from 'reviews:all' set (new reviews will be here)
  const allReviewIds = await kv.smembers('reviews:all');
  
  // 2. Fetch from all reviewed games to ensure backwards compatibility 
  // with reviews created before 'reviews:all' was implemented
  const gamesReviewed = await kv.smembers('games:reviewed');
  const legacyReviewIds = new Set<string>();
  
  await Promise.all(
    (gamesReviewed || []).map(async (slug) => {
      const gReviews = await kv.lrange<string>(`reviews_for_game:${slug}`, 0, -1);
      if (gReviews) {
        gReviews.forEach(id => legacyReviewIds.add(id));
      }
    })
  );
  
  // 3. Merge sets to avoid duplicates
  const finalIds = Array.from(new Set([...(allReviewIds || []), ...legacyReviewIds]));
  
  if (finalIds.length === 0) return [];

  // 4. Fetch the full review objects
  const rawReviews = await kv.mget<GameReview[]>(...finalIds.map(id => `review:${id}`));
  
  // 5. Filter nulls and sort by newest first
  return rawReviews
    .filter((r): r is GameReview => r !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export default async function ModerateReviewsPage() {
  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    redirect('/');
  }

  const allReviews = await getAllReviews();

  return (
    <div>
      <h2 className="pixel-font" style={{ fontSize: '10px', color: '#ff4444', marginBottom: '32px' }}>
        ▼ MODERAÇÃO DE REVIEWS
      </h2>
      <ModerateReviewsList initialReviews={allReviews} />
    </div>
  );
}
