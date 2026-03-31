// src/components/ReviewForm.tsx
'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Game, GameReview } from '@/lib/types';

interface ReviewFormProps {
  game: Game;
  existingReview?: GameReview;
}

const reviewFields = [
  { id: 'jogabilidade', label: 'Jogabilidade' },
  { id: 'arte', label: 'Arte do Jogo' },
  { id: 'trilhaSonora', label: 'Trilha Sonora' },
  { id: 'diversao', label: 'Diversão' },
  { id: 'rejogabilidade', label: 'Rejogabilidade' },
  { id: 'graficos', label: 'Gráficos' },
  { id: 'complexidade', label: 'Complexidade' },
  { id: 'lore', label: 'Lore' },
];

function getScoreColor(val: number) {
  if (val >= 8) return '#39ff14';
  if (val >= 6) return '#ffd700';
  return '#ff4444';
}

export default function ReviewForm({ game, existingReview }: ReviewFormProps) {
  const router = useRouter();
  const { status, data: session } = useSession();
  const isEditing = !!existingReview;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    horasJogadas: existingReview?.horasJogadas.toString() || '',
    scores: existingReview?.scores || {
      jogabilidade: 5, arte: 5, trilhaSonora: 5, diversao: 5,
      rejogabilidade: 5, graficos: 5, complexidade: 5, lore: 5,
    },
  });
  const [averageScore, setAverageScore] = useState(existingReview?.notaFinal || 5);

  useEffect(() => {
    const vals = Object.values(formState.scores);
    setAverageScore(parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)));
  }, [formState.scores]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFormState(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleScoreChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFormState(p => ({
      ...p,
      scores: { ...p.scores, [e.target.name]: parseInt(e.target.value, 10) },
    }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reviews', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: existingReview?.id,
          gameTitle: game.title,
          gameSlug: game.slug,
          horasJogadas: parseFloat(formState.horasJogadas) || 0,
          notaFinal: averageScore,
          scores: formState.scores,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Falha ao processar.');
      router.push(`/game/${game.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <p style={{ fontFamily: "'VT323'", fontSize: '22px', color: '#6060a0' }}>CARREGANDO<span className="blink">...</span></p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 32px', border: '2px solid #2a2a5a', background: '#0d0d1a' }}>
        <h1 className="pixel-font neon-pink" style={{ fontSize: '10px', marginBottom: '20px' }}>ACESSO NEGADO</h1>
        <p style={{ fontFamily: "'VT323'", fontSize: '20px', color: '#a0a0d0', marginBottom: '24px' }}>Você precisa fazer login para deixar uma review.</p>
        <button onClick={() => signIn('google')} className="btn-pixel btn-pixel-cyan" style={{ fontSize: '9px' }}>
          ▶ LOGIN COM GOOGLE
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h1 className="pixel-font" style={{ fontSize: '10px', color: '#00f5ff', marginBottom: '8px', lineHeight: '2' }}>
        {isEditing ? 'EDITAR' : 'NOVA'} REVIEW
      </h1>
      <p style={{ fontFamily: "'VT323'", fontSize: '20px', color: '#ffd700', marginBottom: '8px' }}>
        {game.title}
      </p>
      <p style={{ fontFamily: "'VT323'", fontSize: '17px', color: '#6060a0', marginBottom: '24px' }}>
        Olá, {session?.user?.name}!
      </p>

      <form onSubmit={handleSubmit}>
        {/* Score sliders */}
        <div className="pixel-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <p className="pixel-font" style={{ fontSize: '8px', color: '#6060a0', marginBottom: '20px' }}>CATEGORIAS</p>
          {reviewFields.map(field => {
            const val = formState.scores[field.id as keyof typeof formState.scores];
            const col = getScoreColor(val);
            return (
              <div key={field.id} style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: "'VT323'", fontSize: '18px', color: '#a0a0d0' }}>{field.label}</span>
                  <span style={{ fontFamily: "'Press Start 2P'", fontSize: '11px', color: col, textShadow: `0 0 6px ${col}` }}>
                    {val}/10
                  </span>
                </label>
                <input
                  type="range" min="0" max="10"
                  name={field.id} value={val}
                  onChange={handleScoreChange}
                  style={{ accentColor: col }}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>

        {/* Hours + Final score */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="pixel-card" style={{ padding: '16px' }}>
            <label style={{ display: 'block', fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#6060a0', marginBottom: '8px' }}>
              HORAS JOGADAS
            </label>
            <input
              type="number" step="0.1" name="horasJogadas"
              required value={formState.horasJogadas} onChange={handleChange}
              className="retro-input"
              style={{ fontSize: '22px' }}
            />
          </div>
          <div className="pixel-card" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#6060a0', marginBottom: '12px' }}>NOTA FINAL</p>
            <p style={{
              fontFamily: "'Press Start 2P'", fontSize: '22px',
              color: getScoreColor(averageScore),
              textShadow: `0 0 12px ${getScoreColor(averageScore)}`,
            }}>
              {averageScore}
            </p>
            <p style={{ fontFamily: "'VT323'", fontSize: '16px', color: '#6060a0' }}>/10 (média)</p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px', marginBottom: '16px',
            border: '2px solid #ff4444', background: 'rgba(255,68,68,0.1)',
            fontFamily: "'VT323'", fontSize: '18px', color: '#ff4444',
          }}>
            ✗ {error}
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-pixel btn-pixel-cyan"
          style={{ width: '100%', fontSize: '10px', padding: '14px', opacity: isLoading ? 0.6 : 1 }}>
          {isLoading
            ? (isEditing ? 'SALVANDO...' : 'ENVIANDO...')
            : (isEditing ? '★ SALVAR ALTERAÇÕES' : '▶ PUBLICAR REVIEW')}
        </button>
      </form>
    </div>
  );
}