// src/components/ManageGamesList.tsx
'use client';

import { useState } from 'react';
import { Game } from '@/lib/types';
import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ManageGamesList({ initialGames }: { initialGames: Game[] }) {
  const [games, setGames] = useState(initialGames);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (slug: string) => {
    // Pede confirmação antes de apagar
    if (!window.confirm("Tem a certeza que quer apagar este jogo? Todas as reviews associadas serão perdidas PERMANENTEMENTE.")) {
      return;
    }

    const response = await fetch(`/api/games/${slug}`, { method: 'DELETE' });

    if (response.ok) {
      // Remove o jogo da lista na UI sem precisar de recarregar a página
      setGames(games.filter(game => game.slug !== slug));
      router.refresh(); // Atualiza os dados do servidor em segundo plano
    } else {
      const result = await response.json();
      setError(result.error || 'Falha ao apagar o jogo.');
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg">
      {error && <p className="p-4 text-red-400 bg-red-900/50">{error}</p>}
      <ul className="divide-y divide-slate-700">
        {games.map(game => (
          <li key={game.slug} className="p-4 flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">{game.title}</p>
              <p className="text-sm text-slate-400">/{game.slug}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/admin/edit-game/${game.slug}`} className="text-amber-400 hover:text-amber-300">
                <Edit size={20} />
              </Link>
              <button onClick={() => handleDelete(game.slug)} className="text-red-500 hover:text-red-400">
                <Trash2 size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}