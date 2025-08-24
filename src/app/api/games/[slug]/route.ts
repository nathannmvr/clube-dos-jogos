// src/app/api/games/[slug]/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Game, GameReview } from '@/lib/types'; // Importe os tipos corretos

// --- ATUALIZAR UM JOGO (EDITAR TÍTULO) ---
export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const { title } = await request.json();
    if (!title) {
      return NextResponse.json({ success: false, error: 'Título em falta.' }, { status: 400 });
    }

    const gameKey = `game:${params.slug}`;
    const game = await kv.get<Game>(gameKey);

    if (!game) {
      return NextResponse.json({ success: false, error: 'Jogo não encontrado.' }, { status: 404 });
    }

    // --- LÓGICA DE ATUALIZAÇÃO CORRIGIDA ---
    // 1. Modifica o objeto em JavaScript
    game.title = title;
    // 2. Salva o objeto inteiro de volta usando kv.set
    await kv.set(gameKey, game);
    // --- FIM DA CORREÇÃO ---

    // Atualiza o título em todas as reviews existentes para manter a consistência
    const reviewIds = await kv.lrange<string>(`reviews_for_game:${params.slug}`, 0, -1);
    for (const reviewId of reviewIds) {
      const review = await kv.get<GameReview>(`review:${reviewId}`);
      if (review) {
        // --- LÓGICA DE ATUALIZAÇÃO CORRIGIDA ---
        review.gameTitle = title;
        await kv.set(`review:${reviewId}`, review);
        // --- FIM DA CORREÇÃO ---
      }
    }

    return NextResponse.json({ success: true, message: 'Jogo atualizado com sucesso.' });
  } catch (error) {
    console.error("Erro ao atualizar jogo:", error);
    return NextResponse.json({ success: false, error: 'Falha interna do servidor.' }, { status: 500 });
  }
}

// --- APAGAR UM JOGO ---
export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const { slug } = params;

    // 1. Encontrar todas as reviews associadas ao jogo
    const reviewIds = await kv.lrange<string>(`reviews_for_game:${slug}`, 0, -1);

    for (const reviewId of reviewIds) {
      const review = await kv.get<GameReview>(`review:${reviewId}`);
      if (review) {
        // Apaga o índice de review por utilizador/jogo
        await kv.del(`user:${review.userId}:game:${slug}`);
        // Remove a review do set de reviews do utilizador
        await kv.srem(`user:${review.userId}:reviews`, reviewId);
      }
      // Apaga o objeto da review
      await kv.del(`review:${reviewId}`);
    }

    // 2. Apagar todos os dados do jogo
    await kv.del(`reviews_for_game:${slug}`); // A lista de reviews do jogo
    await kv.srem('games:reviewed', slug);    // O set de jogos com review
    await kv.del(`game:${slug}`);             // O objeto principal do jogo
    await kv.srem('games:all', slug);         // O set de todos os jogos

    return NextResponse.json({ success: true, message: 'Jogo e todas as suas reviews foram apagados.' });

  } catch (error) {
    console.error("Erro ao apagar jogo:", error);
    return NextResponse.json({ success: false, error: 'Falha interna do servidor.' }, { status: 500 });
  }
}