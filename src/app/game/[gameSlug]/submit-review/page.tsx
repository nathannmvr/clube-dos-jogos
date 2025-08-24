// src/app/game/[gameSlug]/submit-review/page.tsx
import { kv } from '@vercel/kv';
import { notFound } from 'next/navigation';
import { Game } from '@/lib/types';
import ReviewForm from '@/components/ReviewForm'; // Nosso formulário agora é um componente

// Busca os dados do jogo no servidor
async function getGame(slug: string): Promise<Game | null> {
    return await kv.get<Game>(`game:${slug}`);
}

export default async function SubmitReviewForGamePage({ params }: { params: { gameSlug: string } }) {
  const game = await getGame(params.gameSlug);

  if (!game) {
    notFound(); // Se o jogo não existe, mostra página 404
  }

  return (
    <div>
      {/* Passamos o jogo para o componente do formulário */}
      <ReviewForm game={game} />
    </div>
  );
}