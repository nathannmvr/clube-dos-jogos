// src/app/api/reviews/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { GameReview } from '@/lib/types';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';

const createSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  // ... (verificação de sessão continua igual)

  if (!session || !session.user) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const reviewData = await request.json();

    // Validação
    if (!reviewData.gameTitle || !reviewData.gameSlug || !reviewData.scores) {
      return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
    }

    // Usa o gameSlug recebido do formulário
    const gameSlug = reviewData.gameSlug;

    const newReview: GameReview = {
      id: nanoid(),
      createdAt: Date.now(),
      userId: session.user.id,
      userName: session.user.name || 'Anônimo',
      userImage: session.user.image || undefined,
      gameTitle: reviewData.gameTitle,
      gameSlug: gameSlug, // Usa o slug recebido
      scores: reviewData.scores,
      horasJogadas: reviewData.horasJogadas,
      notaFinal: reviewData.notaFinal,
    };

    // Salva a review
    await kv.set(`review:${newReview.id}`, newReview);
    // Adiciona o ID à lista de reviews do jogo
    await kv.lpush(`reviews_for_game:${gameSlug}`, newReview.id);
    // Adiciona o jogo ao set de jogos com review
    await kv.sadd('games:reviewed', gameSlug);

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Falha interna ao salvar review' }, { status: 500 });
  }
}