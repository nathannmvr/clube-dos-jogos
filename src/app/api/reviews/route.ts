// src/app/api/reviews/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { GameReview } from '@/lib/types';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// --- CRIAR NOVA REVIEW ---
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado ou ID de utilizador em falta na sessão.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const reviewData = await request.json();
    
    if (!reviewData.gameTitle || !reviewData.gameSlug || !reviewData.scores) {
      return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
    }
    
    const gameSlug = reviewData.gameSlug;

    // --- VERIFICAÇÃO DE DUPLICIDADE ADICIONADA AQUI ---
    // Vamos criar uma chave única para a combinação utilizador + jogo
    const reviewExistsKey = `user:${userId}:game:${gameSlug}`;
    const existingReview = await kv.exists(reviewExistsKey);

    if (existingReview) {
      // Retorna um erro 409 Conflict, que é o código HTTP correto para esta situação
      return NextResponse.json({ success: false, error: 'Você já publicou uma review para este jogo.' }, { status: 409 });
    }
    // --------------------------------------------------

    const newReview: GameReview = {
      id: nanoid(),
      createdAt: Date.now(),
      userId: userId,
      userName: session.user.name || 'Anônimo',
      userImage: session.user.image || undefined,
      gameTitle: reviewData.gameTitle,
      gameSlug: gameSlug,
      scores: reviewData.scores,
      horasJogadas: reviewData.horasJogadas,
      notaFinal: reviewData.notaFinal,
    };

    // Salva a review e todos os índices
    await kv.set(`review:${newReview.id}`, newReview);
    await kv.lpush(`reviews_for_game:${gameSlug}`, newReview.id);
    await kv.sadd('games:reviewed', gameSlug);
    await kv.sadd(`user:${userId}:reviews`, newReview.id);
    // --- NOVO ÍNDICE PARA A VERIFICAÇÃO DE DUPLICIDADE ---
    await kv.set(reviewExistsKey, newReview.id);
    // ----------------------------------------------------

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    console.error("ERRO INESPERADO NA FUNÇÃO POST:", error);
    return NextResponse.json({ success: false, error: 'Falha interna do servidor.' }, { status: 500 });
  }
}

// --- ATUALIZAR REVIEW EXISTENTE ---
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.reviewId) {
      return NextResponse.json({ success: false, error: 'ID da review em falta.' }, { status: 400 });
    }

    const originalReview = await kv.get<GameReview>(`review:${data.reviewId}`);

    // --- CÓDIGO DE DEBUG ADICIONADO AQUI ---
    console.log("\n--- A VERIFICAR PERMISSÕES DE EDIÇÃO ---");
    console.log("ID do utilizador na Sessão atual:", session.user.id);
    console.log("ID do utilizador guardado na Review:", originalReview?.userId);
    console.log("-----------------------------------------");
    // ------------------------------------

    // Verificação de segurança crucial
    if (!originalReview || originalReview.userId !== session.user.id) {
      console.log("VERIFICAÇÃO DE SEGURANÇA FALHOU! Acesso negado.");
      return NextResponse.json({ success: false, error: 'Ação não permitida.' }, { status: 403 });
    }

    const updatedReview: GameReview = {
      ...originalReview,
      scores: data.scores,
      horasJogadas: data.horasJogadas,
      notaFinal: data.notaFinal,
    };

    await kv.set(`review:${data.reviewId}`, updatedReview);
    console.log("SUCESSO: Review atualizada.");

    return NextResponse.json({ success: true, review: updatedReview });

  } catch (error) {
    console.error("ERRO INESPERADO NA FUNÇÃO PUT:", error);
    return NextResponse.json({ success: false, error: 'Falha interna ao atualizar a review' }, { status: 500 });
  }
}