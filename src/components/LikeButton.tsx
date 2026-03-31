'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LikeButton({ reviewId, initialLikes, initialUserLiked }: { reviewId: string, initialLikes: number, initialUserLiked: boolean }) {
  const [likes, setLikes] = useState(initialLikes);
  const [userLiked, setUserLiked] = useState(initialUserLiked);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    
    // Optimistic update
    setUserLiked(!userLiked);
    setLikes(userLiked ? likes - 1 : likes + 1);

    try {
      const method = userLiked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/reviews/${reviewId}/like`, { method });
      const data = await res.json();
      
      if (data.success && typeof data.likesCount === 'number') {
        setLikes(data.likesCount);
      } else {
        // Revert on failure
        setUserLiked(!userLiked);
        setLikes(userLiked ? likes : likes - 1);
      }
    } catch (error) {
      console.error(error);
      setUserLiked(!userLiked);
      setLikes(userLiked ? likes : likes - 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLike}
      disabled={loading}
      className={`btn-pixel ${userLiked ? 'btn-pixel-cyan' : 'btn-pixel-grey'}`} 
      style={{
        display: 'flex', alignItems: 'center', gap: '6px', 
        fontSize: '9px', padding: '6px 12px',
        opacity: loading ? 0.7 : 1
      }}
      title={userLiked ? "Descurtir" : "Curtir"}
    >
      <ThumbsUp size={12} fill={userLiked ? 'currentColor' : 'none'} />
      <span style={{ fontSize: '10px' }}>{likes}</span>
    </button>
  );
}
