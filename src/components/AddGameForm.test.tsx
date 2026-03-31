// src/components/AddGameForm.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddGameForm from './AddGameForm';

// Mock de fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AddGameForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o formulário com input e botão', () => {
    render(<AddGameForm />);

    expect(screen.getByLabelText('Título do Jogo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Jogo' })).toBeInTheDocument();
  });

  it('deve enviar o formulário e mostrar mensagem de sucesso', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ game: { title: 'Novo Jogo', slug: 'novo-jogo' } }),
    });

    render(<AddGameForm />);

    await user.type(screen.getByLabelText('Título do Jogo'), 'Novo Jogo');
    await user.click(screen.getByRole('button', { name: 'Adicionar Jogo' }));

    await waitFor(() => {
      expect(screen.getByText(/adicionado com sucesso/i)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/games', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'Novo Jogo' }),
    }));
  });

  it('deve mostrar mensagem de erro quando a API retorna falha', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Este jogo já foi adicionado.' }),
    });

    render(<AddGameForm />);

    await user.type(screen.getByLabelText('Título do Jogo'), 'Jogo Duplicado');
    await user.click(screen.getByRole('button', { name: 'Adicionar Jogo' }));

    await waitFor(() => {
      expect(screen.getByText('Este jogo já foi adicionado.')).toBeInTheDocument();
    });
  });
});
