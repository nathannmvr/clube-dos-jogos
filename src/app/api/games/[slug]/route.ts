// src/app/api/games/[slug]/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Game, GameReview } from '@/lib/types';

// --- ATUALIZAR UM JOGO (EDITAR TÍTULO) ---
export async function PUT(request: NextRequest, context: { params: { slug: string } }) {
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
    
    // Aceda ao slug através do objeto de contexto
    const { slug } = context.params;
    const gameKey = `game:${slug}`;
    const game = await kv.get<Game>(gameKey);

    if (!game) {
      return NextResponse.json({ success: false, error: 'Jogo não encontrado.' }, { status: 404 });
    }

    game.title = title;
    await kv.set(gameKey, game);

    const reviewIds = await kv.lrange<string>(`reviews_for_game:${slug}`, 0, -1);
    for (const reviewId of reviewIds) {
      const review = await kv.get<GameReview>(`review:${reviewId}`);
      if (review) {
        review.gameTitle = title;
        await kv.set(`review:${reviewId}`, review);
      }
    }

    return NextResponse.json({ success: true, message: 'Jogo atualizado com sucesso.' });
  } catch (error) {
    console.error("Erro ao atualizar jogo:", error);
    return NextResponse.json({ success: false, error: 'Falha interna do servidor.' }, { status: 500 });
  }
}

// --- APAGAR UM JOGO ---
export async function DELETE(request: NextRequest, context: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    // Aceda ao slug através do objeto de contexto
    const { slug } = context.params;

    const reviewIds = await kv.lrange<string>(`reviews_for_game:${slug}`, 0, -1);

    for (const reviewId of reviewIds) {
      const review = await kv.get<GameReview>(`review:${reviewId}`);
      if (review) {
        await kv.del(`user:${review.userId}:game:${slug}`);
        await kv.srem(`user:${review.userId}:reviews`, reviewId);
      }
      await kv.del(`review:${reviewId}`);
    }

    await kv.del(`reviews_for_game:${slug}`);
    await kv.srem('games:reviewed', slug);
    await kv.del(`game:${slug}`);
    await kv.srem('games:all', slug);

    return NextResponse.json({ success: true, message: 'Jogo e todas as suas reviews foram apagados.' });

  } catch (error) {
    console.error("Erro ao apagar jogo:", error);
    return NextResponse.json({ success: false, error: 'Falha interna do servidor.' }, { status: 500 });
  }
}