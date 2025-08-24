// src/app/api/reviews/[reviewId]/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GameReview } from '@/lib/types';

export async function DELETE(request: NextRequest, { params }: { params: { reviewId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { reviewId } = params;

    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Busca a review original para verificar a propriedade e obter outros dados
    const review = await kv.get<GameReview>(`review:${reviewId}`);

    // 2. Verificação de segurança: O utilizador logado é o dono da review?
    if (!review || review.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Ação não permitida.' }, { status: 403 });
    }

    const userId = review.userId;
    const gameSlug = review.gameSlug;

    // 3. Apagar todos os dados e índices associados à review
    await kv.del(`review:${reviewId}`);                           // O objeto principal da review
    await kv.lrem(`reviews_for_game:${gameSlug}`, 1, reviewId);   // Remove da lista de reviews do jogo
    await kv.srem(`user:${userId}:reviews`, reviewId);            // Remove do set de reviews do utilizador
    await kv.del(`user:${userId}:game:${gameSlug}`);              // Remove a chave de verificação de duplicidade

    // Opcional: Verifica se o jogo ficou sem reviews para o remover da lista de "jogos com review"
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