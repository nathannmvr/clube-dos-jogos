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
  { id: 'graficos', label: 'Qualidade dos Gráficos' },
  { id: 'complexidade', label: 'Complexidade' },
  { id: 'lore', label: 'Lore' },
];

export default function ReviewForm({ game, existingReview }: ReviewFormProps) {
  const router = useRouter();
  const { status, data: session } = useSession();

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

  // --- CORREÇÃO AQUI ---
  // A variável 'isEditing' é declarada no escopo principal do componente.
  const isEditing = !!existingReview;

  useEffect(() => {
    const scoresArray = Object.values(formState.scores);
    const sum = scoresArray.reduce((total, score) => total + score, 0);
    const average = sum / scoresArray.length;
    setAverageScore(parseFloat(average.toFixed(1)));
  }, [formState.scores]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormState(prevState => ({ ...prevState, [e.target.name]: e.target.value }));
  };
  
  const handleScoreChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormState(prevState => ({
      ...prevState,
      scores: { ...prevState.scores, [e.target.name]: parseInt(e.target.value, 10) }
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // A variável 'isEditing' já está acessível aqui
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch('/api/reviews', {
        method: method,
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

      if (!response.ok) {
        throw new Error((await response.json()).error || 'Falha ao processar a review.');
      }
      
      router.push(`/game/${game.slug}`);
      router.refresh();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') return <p>Carregando...</p>;
  if (status === 'unauthenticated') {
    return (
      <div className="text-center bg-slate-800 p-8 rounded-lg">
        <h1 className="text-2xl font-bold text-cyan-400 mb-4">Acesso Negado</h1>
        <p className="text-slate-300 mb-6">Você precisa de fazer login para deixar uma review.</p>
        <button onClick={() => signIn('google')} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md">
          Fazer Login com Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">
        {isEditing ? 'Editar' : 'Adicionar'} Review para <span className="text-cyan-400">{game.title}</span>
      </h1>
      <p className="text-slate-400 mb-8">Olá, {session?.user?.name}! {isEditing ? "Altere os dados abaixo." : "Preencha os dados abaixo."}</p>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-8 rounded-lg border border-slate-700">
        <div className="space-y-4 pt-4 border-t border-slate-700">
          {reviewFields.map(field => (
            <div key={field.id}>
              <label htmlFor={field.id} className="block text-sm font-medium text-slate-300 mb-2 flex justify-between">
                <span>{field.label}</span>
                <span className="font-bold text-cyan-400">{formState.scores[field.id as keyof typeof formState.scores]}/10</span>
              </label>
              <input type="range" min="0" max="10" name={field.id} id={field.id} value={formState.scores[field.id as keyof typeof formState.scores]} onChange={handleScoreChange} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700">
            <div>
                <label htmlFor="horasJogadas" className="block text-sm font-medium text-slate-300 mb-2">Horas Jogadas</label>
                <input type="number" step="0.1" name="horasJogadas" id="horasJogadas" required value={formState.horasJogadas} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nota Final (Média)</label>
                <div className="w-full text-center bg-slate-900 border border-slate-700 rounded-md p-2 text-xl font-bold text-cyan-400">
                    {averageScore} / 10
                </div>
            </div>
        </div>
        
        {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}

        <button type="submit" disabled={isLoading} className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors text-lg">
          {isLoading ? (isEditing ? 'A guardar...' : 'A enviar...') : (isEditing ? 'Guardar Alterações' : 'Publicar Review')}
        </button>
      </form>
    </div>
  );
}