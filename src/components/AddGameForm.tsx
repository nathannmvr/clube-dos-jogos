// src/components/AddGameForm.tsx
'use client';
import { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface RawgResult {
  id: number;
  name: string;
  coverUrl: string | null;
}

export default function AddGameForm() {
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [manualCover, setManualCover] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [rawgResults, setRawgResults] = useState<RawgResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<RawgResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setRawgResults([]), []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeDropdown]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDropdown(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeDropdown]);

  // Search RAWG as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (title.trim().length < 2) { setRawgResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/rawg?q=${encodeURIComponent(title)}`);
        const data = await res.json();
        setRawgResults(data.results || []);
      } catch { setRawgResults([]); }
      finally { setSearching(false); }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title]);

  const handleSelectGame = (game: RawgResult) => {
    setSelectedGame(game);
    setTitle(game.name);
    setCoverUrl(game.coverUrl || '');
    setRawgResults([]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const finalCover = manualCover.trim() || coverUrl;

    const response = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, coverUrl: finalCover || null }),
    });

    const result = await response.json();

    if (response.ok) {
      setMessage({ type: 'success', text: `"${result.game.title}" adicionado!` });
      setTitle(''); setCoverUrl(''); setManualCover(''); setSelectedGame(null);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao adicionar.' });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: "'VT323', monospace" }}>
      {/* Title field with RAWG search */}
      <div ref={containerRef} style={{ marginBottom: '24px', position: 'relative' }}>
        <label style={{ display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#6060a0', marginBottom: '8px', letterSpacing: '1px' }}>
          TÍTULO DO JOGO
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="Digite para buscar..."
          className="retro-input"
        />
        {/* Search results dropdown */}
        {(rawgResults.length > 0 || searching) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#08081a', border: '2px solid #39ff14',
            boxShadow: '0 8px 24px rgba(57,255,20,0.2)', maxHeight: '360px', overflowY: 'auto',
          }}>
            {/* Dismiss button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid #1a1a3a', background: '#0d0d1a' }}>
              <span style={{ fontFamily: "'VT323'", fontSize: '15px', color: '#6060a0' }}>Selecione ou digite e salve diretamente</span>
              <button type="button" onClick={closeDropdown} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontFamily: "'Press Start 2P'", fontSize: '10px', padding: '2px 6px' }} title="Fechar">✕</button>
            </div>
            {searching && (
              <p style={{ padding: '12px', color: '#6060a0', fontFamily: "'Press Start 2P'", fontSize: '8px' }}>
                BUSCANDO<span className="blink">...</span>
              </p>
            )}
            {rawgResults.map(game => (
              <button
                key={game.id}
                type="button"
                onClick={() => handleSelectGame(game)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', background: 'transparent',
                  borderBottom: '1px solid #1a1a3a', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#12122a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {game.coverUrl ? (
                  <Image src={game.coverUrl} alt={game.name} width={48} height={32}
                    style={{ objectFit: 'cover', border: '1px solid #2a2a5a', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 32, background: '#1a1a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6060a0' }}>
                    ?
                  </div>
                )}
                <span style={{ color: '#00f5ff', fontSize: '18px', textAlign: 'left' }}>{game.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cover preview if selected from RAWG */}
      {(selectedGame?.coverUrl || coverUrl) && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#39ff14', marginBottom: '8px' }}>
            ✓ CAPA SELECIONADA:
          </p>
          <div className="pixel-border-green" style={{ display: 'inline-block' }}>
            <Image
              src={manualCover.trim() || coverUrl}
              alt="Capa preview"
              width={200} height={130}
              style={{ objectFit: 'cover', display: 'block' }}
              onError={() => {}}
            />
          </div>
        </div>
      )}

      {/* Manual cover URL */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#6060a0', marginBottom: '8px' }}>
          URL DA CAPA (MANUAL / OPCIONAL)
        </label>
        <input
          type="url"
          value={manualCover}
          onChange={e => setManualCover(e.target.value)}
          placeholder="https://exemplo.com/capa.jpg"
          className="retro-input"
        />
        <p style={{ fontSize: '14px', color: '#6060a0', marginTop: '4px' }}>
          ↑ Deixe vazio para usar a capa buscada acima
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-pixel btn-pixel-green"
        style={{ width: '100%', fontSize: '10px', padding: '14px', opacity: isLoading ? 0.6 : 1 }}
      >
        {isLoading ? 'SALVANDO...' : '▶ ADICIONAR JOGO'}
      </button>

      {message && (
        <div style={{
          marginTop: '16px', padding: '12px', textAlign: 'center',
          border: `2px solid ${message.type === 'success' ? '#39ff14' : '#ff3030'}`,
          color: message.type === 'success' ? '#39ff14' : '#ff4444',
          fontSize: '16px', fontFamily: "'VT323'"
        }}>
          {message.type === 'success' ? '★ ' : '✗ '}{message.text}
        </div>
      )}
    </form>
  );
}