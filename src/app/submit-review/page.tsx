'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

// Constante com os campos de score para gerar o formulário dinamicamente
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
  const { data: session, status } = useSession(); // Pega o status e dados da sessão de login

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado inicial do formulário, sem os campos de nome e nota final
  const [formState, setFormState] = useState({
    gameTitle: '',
    horasJogadas: '',
    scores: {
      jogabilidade: 5, arte: 5, trilhaSonora: 5, diversao: 5,
      rejogabilidade: 5, graficos: 5, complexidade: 5, lore: 5,
    },
  });
  
  // Novo estado para armazenar e exibir a média calculada
  const [averageScore, setAverageScore] = useState(5);

  // Este "efeito" roda toda vez que uma das notas nos sliders muda.
  // Ele recalcula a média e atualiza o estado.
  useEffect(() => {
    const scoresArray = Object.values(formState.scores);
    const sum = scoresArray.reduce((total, score) => total + score, 0);
    const average = sum / scoresArray.length;
    setAverageScore(parseFloat(average.toFixed(1))); // Arredonda para 1 casa decimal
  }, [formState.scores]);

  // Handler para os inputs de texto e número
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };
  
  // Handler específico para os sliders de nota
  const handleScoreChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      scores: { ...prevState.scores, [name]: parseInt(value, 10) }
    }));
  };

  // Função chamada ao enviar o formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formState.gameTitle.trim()) {
      setError("O título do jogo é obrigatório.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          horasJogadas: parseFloat(formState.horasJogadas) || 0,
          notaFinal: averageScore, // A nota final enviada é a média calculada
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao enviar a review.');
      }
      
      const result = await response.json();
      router.push(`/game/${result.review.gameSlug}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- RENDERIZAÇÃO DO COMPONENTE ---

  // Exibe um estado de carregamento enquanto a sessão é verificada
  if (status === 'loading') {
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-300">Carregando...</h1>
        </div>
    );
  }

  // Se o usuário não estiver logado, exibe uma mensagem e o botão de login
  if (status === 'unauthenticated') {
    return (
        <div className="text-center bg-slate-800 p-8 rounded-lg max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-cyan-400 mb-4">Acesso Negado</h1>
            <p className="text-slate-300 mb-6">Você precisa fazer login para poder enviar uma review.</p>
            <button 
                onClick={() => signIn('google')} 
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md transition-colors"
            >
                Fazer Login com Google
            </button>
        </div>
    );
  }

  // Se o usuário estiver logado, exibe o formulário completo
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Enviar Nova Review</h1>
      <p className="text-slate-400 mb-8">Olá, {session?.user?.name}! Preencha os dados abaixo.</p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-8 rounded-lg border border-slate-700">
        
        <div>
            <label htmlFor="gameTitle" className="block text-sm font-medium text-slate-300 mb-2">Título do Jogo</label>
            <input type="text" name="gameTitle" id="gameTitle" required value={formState.gameTitle} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"/>
        </div>

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
          {isLoading ? 'Enviando...' : 'Publicar Review'}
        </button>
      </form>
    </div>
  );
}