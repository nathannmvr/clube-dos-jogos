// src/app/api/games/route.ts
import { kv } from '@vercel/kv';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { Game } from '@/lib/types';

const createSlug = (title: string) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  // 1. Verificação de Segurança: O usuário é admin?
  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    return NextResponse.json({ success: false, error: 'Acesso negado. Apenas administradores podem adicionar jogos.' }, { status: 403 });
  }

  try {
    const { title } = await request.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, error: 'Título inválido.' }, { status: 400 });
    }

    const slug = createSlug(title);

    // 2. Verifica se o jogo já existe
    const gameExists = await kv.exists(`game:${slug}`);
    if (gameExists) {
        return NextResponse.json({ success: false, error: 'Este jogo já foi adicionado.' }, { status: 409 });
    }

    const newGame: Game = { title, slug };

    // 3. Salva o novo jogo no banco de dados
    await kv.set(`game:${slug}`, newGame);
    // Adiciona a um set para listarmos todos os jogos facilmente
    await kv.sadd('games:all', slug); 

    return NextResponse.json({ success: true, game: newGame });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Falha interna ao adicionar jogo' }, { status: 500 });
  }
}