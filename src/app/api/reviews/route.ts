// src/app/api/reviews/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { GameReview } from '@/lib/types';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// --- CRIAR NOVA REVIEW ---
export async function POST(request: NextRequest) {
  console.log("\n--- INICIANDO CRIAÇÃO DE REVIEW ---");
  try {
    const session = await getServerSession(authOptions);

    // Log mais seguro para o objeto da sessão
    if (session && session.user) {
      console.log(`Sessão encontrada para o utilizador: ${session.user.name}`);
      console.log(`ID do utilizador na sessão: ${session.user.id}`);
    } else {
      console.log("Nenhuma sessão de utilizador foi encontrada.");
    }
    
    if (!session || !session.user || !session.user.id) {
      console.error("FALHA DE SEGURANÇA: Acesso negado. A sessão ou o ID do utilizador estão em falta.");
      return NextResponse.json({ success: false, error: 'Não autorizado ou ID do utilizador em falta na sessão.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const reviewData = await request.json();
    
    // ... (validação de reviewData) ...
    
    const newReview: GameReview = {
      id: nanoid(),
      createdAt: Date.now(),
      userId: userId,
      userName: session.user.name || 'Anônimo',
      userImage: session.user.image || undefined,
      gameTitle: reviewData.gameTitle,
      gameSlug: reviewData.gameSlug,
      scores: reviewData.scores,
      horasJogadas: reviewData.horasJogadas,
      notaFinal: reviewData.notaFinal,
    };

    console.log(`A criar review para o jogo '${newReview.gameTitle}' pelo utilizador com ID: ${userId}`);
    
    await kv.set(`review:${newReview.id}`, newReview);
    await kv.lpush(`reviews_for_game:${newReview.gameSlug}`, newReview.id);
    await kv.sadd('games:reviewed', newReview.gameSlug);
    await kv.sadd(`user:${userId}:reviews`, newReview.id);
    
    console.log(`SUCESSO: Review ${newReview.id} salva e indexada.`);
    console.log("--- FIM DA CRIAÇÃO DE REVIEW ---");

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    console.error("ERRO INESPERADO:", error);
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