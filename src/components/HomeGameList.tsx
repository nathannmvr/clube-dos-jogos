'use client';

import { useState, useMemo } from 'react';
import { Game } from '@/lib/types';
import GameCard from './GameCard';

type GameWithStats = Game & { reviewCount: number; avgScore: number | null };

export default function HomeGameList({ games, allCategories }: { games: GameWithStats[], allCategories: string[] }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const matchSearch = g.title.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory ? (g.categories && g.categories.includes(selectedCategory)) : true;
      return matchSearch && matchCat;
    });
  }, [games, search, selectedCategory]);

  return (
    <div>
      {/* Filtros */}
      <div style={{
        display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap',
        background: '#0d0d1a', padding: '16px', border: '2px solid #2a2a5a'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#6060a0', marginBottom: '8px' }}>
            BUSCA
          </label>
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar por título..."
            className="retro-input"
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ minWidth: '200px' }}>
          <label style={{ display: 'block', fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#6060a0', marginBottom: '8px' }}>
            CATEGORIA
          </label>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="retro-input"
            style={{ width: '100%', cursor: 'pointer' }}
          >
            <option value="">TODAS AS CATEGORIAS</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredGames.length === 0 ? (
         <div style={{ padding: '32px', textAlign: 'center', background: '#08081a', border: '1px dashed #2a2a5a' }}>
            <p style={{ fontFamily: "'VT323'", fontSize: '20px', color: '#6060a0' }}>Nenhum jogo encontrado com os filtros atuais.</p>
         </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {filteredGames.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
