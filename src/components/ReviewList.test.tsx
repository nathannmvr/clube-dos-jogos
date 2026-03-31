// src/components/ReviewList.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewList from './ReviewList';
import { GameReview } from '@/lib/types';

// Mock do next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock do next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock de fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock de confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

const mockReview: GameReview = {
  id: 'review-1',
  userId: 'user1',
  userName: 'Test User',
  userImage: 'https://example.com/avatar.jpg',
  gameTitle: 'Meu Jogo',
  gameSlug: 'meu-jogo',
  createdAt: Date.now(),
  scores: {
    jogabilidade: 8, arte: 7, trilhaSonora: 9, diversao: 8,
    rejogabilidade: 7, graficos: 8, complexidade: 6, lore: 9,
  },
  horasJogadas: 10,
  notaFinal: 7.8,
};

describe('ReviewList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a lista de reviews com dados do usuário e scores', () => {
    render(<ReviewList initialReviews={[mockReview]} currentUserId="user2" />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('7.8/10')).toBeInTheDocument();
    expect(screen.getByText('10h')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não há reviews', () => {
    render(<ReviewList initialReviews={[]} />);

    expect(screen.getByText(/ainda não há nenhuma review/i)).toBeInTheDocument();
  });

  it('deve mostrar botões de editar/apagar apenas para o dono da review', () => {
    const { rerender } = render(
      <ReviewList initialReviews={[mockReview]} currentUserId="user1" />
    );

    // O dono (user1) deve ver os botões
    expect(screen.getByTitle('Editar')).toBeInTheDocument();
    expect(screen.getByTitle('Apagar')).toBeInTheDocument();

    // Outro usuário (user2) não deve ver
    rerender(
      <ReviewList initialReviews={[mockReview]} currentUserId="user2" />
    );
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Apagar')).not.toBeInTheDocument();
  });

  it('deve chamar a API ao confirmar a exclusão de uma review', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ReviewList initialReviews={[mockReview]} currentUserId="user1" />);

    await user.click(screen.getByTitle('Apagar'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/reviews/review-1', { method: 'DELETE' });
    });
  });

  it('não deve chamar a API se o usuário cancelar a confirmação', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);

    render(<ReviewList initialReviews={[mockReview]} currentUserId="user1" />);

    await user.click(screen.getByTitle('Apagar'));

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
