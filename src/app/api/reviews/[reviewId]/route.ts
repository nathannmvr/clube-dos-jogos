// src/app/api/reviews/[reviewId]/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GameReview } from '@/lib/types';

// Define the type for the context object, as expected by your build tool
type RouteContext = {
  params: Promise<{ reviewId: string }>
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    // Await the params to resolve the Promise before using reviewId
    const { reviewId } = await context.params;

    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const review = await kv.get<GameReview>(`review:${reviewId}`);

    if (!review || review.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Ação não permitida.' }, { status: 403 });
    }

    const userId = review.userId;
    const gameSlug = review.gameSlug;

    await kv.del(`review:${reviewId}`);
    await kv.lrem(`reviews_for_game:${gameSlug}`, 1, reviewId);
    await kv.srem(`user:${userId}:reviews`, reviewId);
    await kv.del(`user:${userId}:game:${gameSlug}`);

    const remainingReviews = await kv.llen(`reviews_for_game:${gameSlug}`);
    if (remainingReviews === 0) {
      await kv.srem('games:reviewed', gameSlug);
    }

    return NextResponse.json({ success: true, message: 'Review apagada com sucesso.' });

  } catch (error) {
    console.error("Erro ao apagar review:", error);
    return NextResponse.json({ success: false, error: 'Falha interna do servidor.' }, { status: 500 });
  }
}