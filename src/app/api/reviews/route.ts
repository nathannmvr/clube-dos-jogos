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

  if (!session || !session.user) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const reviewData = await request.json();

    if (!reviewData.gameTitle || !reviewData.scores) {
      return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
    }
    
    const gameSlug = createSlug(reviewData.gameTitle);

    // Objeto a ser salvo no banco de dados
    const newReview: GameReview = {
      id: nanoid(),
      createdAt: Date.now(),
      
      // Dados do usuário (da sessão)
      userId: session.user.id,
      userName: session.user.name || 'Usuário Anônimo',
      userImage: session.user.image || undefined,
      
      // Dados do jogo (do formulário)
      gameTitle: reviewData.gameTitle,
      gameSlug: gameSlug,
      
      // --- ESTAS ERAM AS LINHAS FALTANTES ---
      scores: reviewData.scores,
      horasJogadas: reviewData.horasJogadas,
      notaFinal: reviewData.notaFinal,
      // ------------------------------------
    };

    // Salva o objeto COMPLETO no KV
    await kv.set(`review:${newReview.id}`, newReview);
    await kv.lpush(`reviews_for_game:${gameSlug}`, newReview.id);
    await kv.sadd('games:reviewed', gameSlug);

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Falha interna ao salvar review' }, { status: 500 });
  }
}