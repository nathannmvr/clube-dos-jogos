// src/app/page.tsx

import { kv } from '@vercel/kv';
import Link from 'next/link';
import { Game } from '@/lib/types';

// Função para buscar todos os jogos cadastrados pelos admins
async function getAllGames() {
  // Busca a lista de slugs de TODOS os jogos do set 'games:all'
  const gameSlugs = await kv.smembers('games:all');
  
  const games = await Promise.all(
    gameSlugs.map(async (slug) => {
      // Para cada jogo, busca os seus detalhes
      const gameData = await kv.get<Game>(`game:${slug}`);
      // Conta quantas reviews existem para aquele jogo
      const reviewCount = await kv.llen(`reviews_for_game:${slug}`);
      
      return {
        slug: slug,
        title: gameData?.title || slug, // Usa o título guardado ou o slug como fallback
        reviewCount: reviewCount,
      };
    })
  );
  
  // Ordena os jogos por ordem alfabética
  return games.sort((a, b) => a.title.localeCompare(b.title));
}


export default async function HomePage() {

  // --- CÓDIGO TEMPORÁRIO PARA RESETAR TUDO ---
  // 1. Descomente as linhas abaixo.
  // 2. Salve o arquivo e recarregue a página inicial (localhost:3000 ou o site da Vercel) UMA VEZ.
  // 3. Comente ou apague as linhas novamente para não executar a limpeza toda vez.

  // const allKeys = await kv.keys('*');
  // if (allKeys.length > 0) {
  //   await kv.del(...allKeys);
  //   console.log('Banco de dados resetado! Chaves apagadas:', allKeys);
  // }
  // ---------------------------------------------

  const games = await getAllGames();

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">Jogos do Clube</h1>
      
      {games.length === 0 ? (
        <p className="text-center text-slate-400">Nenhum jogo foi adicionado pelo administrador ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link 
              key={game.slug} 
              href={`/game/${game.slug}`} 
              className="block p-6 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700/50 hover:border-cyan-500 transition-all"
            >
              <h2 className="text-2xl font-semibold text-cyan-400">{game.title}</h2>
              <p className="text-slate-400 mt-2">
                {/* Mostra a contagem de reviews ou uma mensagem se não houver nenhuma */}
                {game.reviewCount > 0 ? `${game.reviewCount} ${game.reviewCount > 1 ? 'reviews' : 'review'}` : 'Nenhuma review ainda'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}