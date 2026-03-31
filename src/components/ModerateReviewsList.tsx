'use client';

import { useState } from 'react';
import { GameReview } from '@/lib/types';
import { Clock, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function ModerateReviewsList({ initialReviews }: { initialReviews: GameReview[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Apagar esta review de vez? Esta ação não pode ser desfeita.")) return;
    
    setError(null);
    const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
    if (res.ok) {
      setReviews(curr => curr.filter(r => r.id !== reviewId));
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao apagar review');
    }
  };

  if (reviews.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', background: '#0d0d1a', border: '1px dashed #2a2a5a' }}>
        <p style={{ fontFamily: "'VT323'", fontSize: '20px', color: '#6060a0' }}>Nenhuma review encontrada.</p>
      </div>
    );
  }

  return (
    <div>
      {error && <div style={{ color: '#ff4444', marginBottom: '16px', fontFamily: "'VT323'", fontSize: '18px' }}>{error}</div>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reviews.map(review => (
          <div key={review.id} style={{ background: '#08081a', border: '2px solid #2a2a5a', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="pixel-font" style={{ fontSize: '10px', color: '#00f5ff' }}>JOGO: {review.gameTitle}</span>
                <span style={{ marginLeft: '16px', fontFamily: "'VT323'", color: '#6060a0', fontSize: '14px' }}>por {review.userName}</span>
              </div>
              <button 
                onClick={() => handleDelete(review.id)}
                className="btn-pixel btn-pixel-grey" 
                style={{ color: '#ff4444', padding: '6px 10px' }}
                title="Apagar Review"
              >
                <Trash2 size={16} /> APAGAR
              </button>
            </div>
            
            <div style={{ background: '#050510', padding: '12px', border: '1px solid #1a1a3a', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <Clock size={16} color="#6060a0" />
                 <span style={{ fontFamily: "'VT323'", fontSize: '18px' }}>{review.horasJogadas}h</span>
               </div>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <Star size={16} color="#ffd700" />
                 <span className="neon-yellow" style={{ fontFamily: "'Press Start 2P'", fontSize: '10px' }}>{review.notaFinal}/10</span>
               </div>
               <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'VT323'", fontSize: '16px', color: '#a0a0d0' }}>
                    DATA: {new Date(review.createdAt).toLocaleString('pt-BR')}
                  </p>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
