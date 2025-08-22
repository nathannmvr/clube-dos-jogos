// src/app/api/reviews/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { GameReview } from '@/lib/types';
import { nanoid } from 'nanoid';

// Função para criar um "slug" a partir do título do jogo
const createSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // substitui caracteres não-alfanuméricos por hífens
    .replace(/^-+|-+$/g, ''); // remove hífens do início e do fim
};

export async function POST(request: NextRequest) {
  try {
    const reviewData = await request.json();

    // Validação simples dos dados recebidos
    if (!reviewData.userName || !reviewData.gameTitle || !reviewData.scores) {
      return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
    }
    
    const gameSlug = createSlug(reviewData.gameTitle);

    const newReview: GameReview = {
      id: nanoid(),
      createdAt: Date.now(),
      userName: reviewData.userName,
      gameTitle: reviewData.gameTitle,
      gameSlug: gameSlug,
      scores: reviewData.scores,
      horasJogadas: reviewData.horasJogadas,
      notaFinal: reviewData.notaFinal,
    };

    // Salva a review individualmente
    await kv.set(`review:${newReview.id}`, newReview);

    // Adiciona o ID da review na lista de reviews daquele jogo
    await kv.lpush(`reviews_for_game:${gameSlug}`, newReview.id);
    
    // Adiciona o jogo a um set para sabermos quais jogos já foram avaliados (não permite duplicatas)
    await kv.sadd('games:reviewed', gameSlug);

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Falha interna ao salvar review' }, { status: 500 });
  }
}