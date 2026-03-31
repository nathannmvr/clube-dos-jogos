// src/components/ReviewList.tsx
'use client';

import { useState } from 'react';
import { GameReview } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Star, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LikeButton from './LikeButton';

const SCORE_LABELS: Record<string, string> = {
  jogabilidade: 'Jogabilidade', arte: 'Arte', trilhaSonora: 'Trilha',
  diversao: 'Diversão', rejogabilidade: 'Rejog.', graficos: 'Gráficos',
  complexidade: 'Complex.', lore: 'Lore',
};

function ScoreBadge({ value }: { value: number }) {
  const color = value >= 8 ? '#39ff14' : value >= 6 ? '#ffd700' : '#ff4444';
  const bg = value >= 8 ? 'rgba(57,255,20,0.1)' : value >= 6 ? 'rgba(255,215,0,0.1)' : 'rgba(255,68,68,0.1)';
  return (
    <div style={{
      padding: '4px 6px', border: `1px solid ${color}`,
      background: bg, textAlign: 'center',
    }}>
      <div style={{ fontFamily: "'VT323'", fontSize: '16px', color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function ReviewCard({ review, currentUserId, onDelete }: {
  review: GameReview;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const isOwner = review.userId === currentUserId;

  const handleDelete = () => {
    if (window.confirm('Apagar esta review permanentemente?')) onDelete(review.id);
  };

  return (
    <div className="pixel-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '16px' }}>
      {/* Review Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: '#0d0d22',
        borderBottom: '2px solid #2a2a5a',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {review.userImage && (
            <Image src={review.userImage} alt={review.userName} width={32} height={32}
              style={{ borderRadius: 0, border: '2px solid #39ff14' }} />
          )}
          <span style={{ fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#00f5ff' }}>
            {review.userName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: "'VT323'", fontSize: '15px', color: '#6060a0' }}>
            {new Date(review.createdAt).toLocaleDateString('pt-BR')}
          </span>
          {isOwner && (
            <>
              <Link href={`/review/${review.id}/edit`} title="Editar"
                style={{ color: '#ffd700' }}>
                <Edit size={16} />
              </Link>
              <button onClick={handleDelete} title="Apagar" style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Score Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px', background: '#1a1a3a',
        borderBottom: '1px solid #1a1a3a',
      }}>
        {review.scores && Object.entries(review.scores).map(([key, val]) => (
          <div key={key} style={{ background: '#12122a', padding: '8px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'VT323'", fontSize: '13px', color: '#6060a0', marginBottom: '4px' }}>
              {SCORE_LABELS[key] || key}
            </p>
            <ScoreBadge value={val} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', background: '#0d0d22',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6060a0' }}>
            <Clock size={14} />
            <span style={{ fontFamily: "'VT323'", fontSize: '18px' }}>{review.horasJogadas}h</span>
          </div>
          <LikeButton 
            reviewId={review.id} 
            initialLikes={review.likesCount ?? 0} 
            initialUserLiked={review.userLiked ?? false} 
          />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: "'Press Start 2P'", fontSize: '12px',
        }}>
          <Star size={14} style={{ color: '#ffd700' }} />
          <span className="neon-yellow">{review.notaFinal}/10</span>
        </div>
      </div>
    </div>
  );
}

export default function ReviewList({ initialReviews, currentUserId }: {
  initialReviews: GameReview[];
  currentUserId?: string;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDeleteReview = async (reviewId: string) => {
    setError(null);
    const response = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
    if (response.ok) {
      setReviews(curr => curr.filter(r => r.id !== reviewId));
      router.refresh();
    } else {
      const result = await response.json();
      setError(result.error || 'Não foi possível apagar a review.');
    }
  };

  if (reviews.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 32px',
        border: '2px solid #2a2a5a', background: '#0d0d1a',
      }}>
        <p style={{ fontFamily: "'Press Start 2P'", fontSize: '9px', color: '#6060a0' }}>
          AINDA NÃO HÁ NENHUMA REVIEW
        </p>
        <p style={{ fontFamily: "'VT323'", fontSize: '20px', color: '#39ff14', marginTop: '12px' }}>
          Seja o primeiro a avaliar este jogo!
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{
          padding: '12px', marginBottom: '16px',
          border: '2px solid #ff4444', background: 'rgba(255,68,68,0.1)',
          fontFamily: "'VT323'", fontSize: '18px', color: '#ff4444',
        }}>
          ✗ {error}
        </div>
      )}
      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} currentUserId={currentUserId} onDelete={handleDeleteReview} />
      ))}
    </div>
  );
}