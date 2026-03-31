'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FavoriteButton({ gameSlug, initialIsFavorite }: { gameSlug: string, initialIsFavorite: boolean }) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleFavorite = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/user/favorites/${gameSlug}`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        await fetch(`/api/user/favorites/${gameSlug}`, { method: 'POST' });
        setIsFavorite(true);
      }
      router.refresh(); // optionally refresh page data
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleFavorite} 
      disabled={loading}
      className={`btn-pixel ${isFavorite ? 'btn-pixel-red' : 'btn-pixel-grey'}`} 
      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', opacity: loading ? 0.7 : 1 }}
    >
      <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} /> 
      {isFavorite ? 'FAVORITADO' : 'FAVORITAR'}
    </button>
  );
}
