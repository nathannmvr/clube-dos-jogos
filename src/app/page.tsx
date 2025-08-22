// src/app/page.tsx

import { kv } from '@vercel/kv';
import Link from 'next/link';
import { GameReview } from '@/lib/types';

async function getReviewedGames() {
  // Pega a lista de todos os slugs de jogos que já foram salvos
  const gameSlugs = await kv.smembers('games:reviewed');
  
  const games = await Promise.all(
    gameSlugs.map(async (slug) => {
      const reviewIds = await kv.lrange(`reviews_for_game:${slug}`, 0, 0); // Pega a review mais recente
      const firstReview = await kv.get<GameReview>(`review:${reviewIds[0]}`);
      const reviewCount = await kv.llen(`reviews_for_game:${slug}`);
      return {
        slug: slug,
        title: firstReview?.gameTitle || slug,
        reviewCount: reviewCount,
      };
    })
  );
  
  return games.sort((a, b) => a.title.localeCompare(b.title));
}


export default async function HomePage() {

   // --- CÓDIGO TEMPORÁRIO PARA LIMPEZA ---
  // Descomente as linhas abaixo, salve o arquivo e recarregue a página inicial UMA VEZ.
  // Depois, comente ou apague as linhas novamente.
  // await kv.del('games:reviewed');
  // const allKeys = await kv.keys('reviews_for_game:*');
  // if(allKeys.length > 0) await kv.del(...allKeys);
  // ------------------------------------
  
  const games = await getReviewedGames();

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">Jogos Avaliados</h1>
      
      {games.length === 0 ? (
        <p className="text-center text-slate-400">Nenhum jogo foi avaliado ainda. Seja o primeiro!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link 
              key={game.slug} 
              href={`/game/${game.slug}`} 
              className="block p-6 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700/50 hover:border-cyan-500 transition-all"
            >
              <h2 className="text-2xl font-semibold text-cyan-400">{game.title}</h2>
              <p className="text-slate-400 mt-2">{game.reviewCount} {game.reviewCount > 1 ? 'reviews' : 'review'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}