// src/components/AddGameForm.tsx
'use client';
import { useState, FormEvent } from 'react';

export default function AddGameForm() {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const response = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    const result = await response.json();

    if (response.ok) {
      setMessage({ type: 'success', text: `Jogo "${result.game.title}" adicionado com sucesso!` });
      setTitle('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Ocorreu um erro.' });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-800 p-8 rounded-lg">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Título do Jogo</label>
        <input
          type="text"
          name="title"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
      </div>
      <button type="submit" disabled={isLoading} className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-md">
        {isLoading ? 'Adicionando...' : 'Adicionar Jogo'}
      </button>
      {message && (
        <p className={`text-center mt-4 p-2 rounded-md ${message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}