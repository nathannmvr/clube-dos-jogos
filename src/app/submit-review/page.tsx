// src/app/submit-review/page.tsx
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

// Definindo os campos para o formulário
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

export default function SubmitReviewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    userName: '',
    gameTitle: '',
    horasJogadas: '',
    notaFinal: '',
    scores: {
      jogabilidade: 5, arte: 5, trilhaSonora: 5, diversao: 5,
      rejogabilidade: 5, graficos: 5, complexidade: 5, lore: 5,
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };
  
  const handleScoreChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      scores: { ...prevState.scores, [name]: parseInt(value, 10) }
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formState.userName || !formState.gameTitle) {
      setError("Nome e Título do Jogo são obrigatórios.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          horasJogadas: parseFloat(formState.horasJogadas) || 0,
          notaFinal: parseFloat(formState.notaFinal) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar a review.');
      }
      
      const result = await response.json();
      router.push(`/game/${result.review.gameSlug}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Enviar Nova Review</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-8 rounded-lg border border-slate-700">
        
        {/* Campos de Texto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="userName" className="block text-sm font-medium text-slate-300 mb-2">Seu Nome / Apelido</label>
                <input type="text" name="userName" id="userName" required value={formState.userName} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
            <div>
                <label htmlFor="gameTitle" className="block text-sm font-medium text-slate-300 mb-2">Título do Jogo</label>
                <input type="text" name="gameTitle" id="gameTitle" required value={formState.gameTitle} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
        </div>

        {/* Scores com Sliders */}
        <div className="space-y-4">
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

        {/* Campos Numéricos Finais */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="horasJogadas" className="block text-sm font-medium text-slate-300 mb-2">Horas Jogadas</label>
                <input type="number" step="0.1" name="horasJogadas" id="horasJogadas" required value={formState.horasJogadas} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
            <div>
                <label htmlFor="notaFinal" className="block text-sm font-medium text-slate-300 mb-2">Nota Final</label>
                <input type="number" step="0.1" min="0" max="10" name="notaFinal" id="notaFinal" required value={formState.notaFinal} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
        </div>
        
        {error && <p className="text-red-400">{error}</p>}

        <button type="submit" disabled={isLoading} className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-md transition-colors text-lg">
          {isLoading ? 'Enviando...' : 'Publicar Review'}
        </button>
      </form>
    </div>
  );
}