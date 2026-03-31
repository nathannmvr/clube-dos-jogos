/**
 * @jest-environment node
 */
// src/app/api/reviews/[reviewId]/route.test.ts

import { NextRequest } from 'next/server';

jest.mock('@/lib/kv', () => ({
  kv: {
    get: jest.fn(),
    del: jest.fn(),
    lrem: jest.fn(),
    srem: jest.fn(),
    llen: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

import { DELETE } from './route';
import { kv } from '@/lib/kv';
import { getServerSession } from 'next-auth';

const mockKv = kv as jest.Mocked<typeof kv>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

function createContext(reviewId: string) {
  return { params: Promise.resolve({ reviewId }) };
}

describe('DELETE /api/reviews/[reviewId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve apagar a review do próprio usuário com sucesso', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user1', name: 'Test' },
    } as never);
    (mockKv.get as jest.Mock).mockResolvedValue({
      id: 'review-1',
      userId: 'user1',
      gameSlug: 'meu-jogo',
    });
    (mockKv.del as jest.Mock).mockResolvedValue(1);
    (mockKv.lrem as jest.Mock).mockResolvedValue(1);
    (mockKv.srem as jest.Mock).mockResolvedValue(1);
    (mockKv.llen as jest.Mock).mockResolvedValue(2);

    const request = new NextRequest('http://localhost/api/reviews/review-1', { method: 'DELETE' });
    const response = await DELETE(request, createContext('review-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockKv.del).toHaveBeenCalledWith('review:review-1');
    expect(mockKv.lrem).toHaveBeenCalledWith('reviews_for_game:meu-jogo', 1, 'review-1');
    expect(mockKv.srem).toHaveBeenCalledWith('user:user1:reviews', 'review-1');
  });

  it('deve remover jogo dos games:reviewed se for a última review', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user1', name: 'Test' },
    } as never);
    (mockKv.get as jest.Mock).mockResolvedValue({
      id: 'review-1',
      userId: 'user1',
      gameSlug: 'meu-jogo',
    });
    (mockKv.del as jest.Mock).mockResolvedValue(1);
    (mockKv.lrem as jest.Mock).mockResolvedValue(1);
    (mockKv.srem as jest.Mock).mockResolvedValue(1);
    (mockKv.llen as jest.Mock).mockResolvedValue(0);

    const request = new NextRequest('http://localhost/api/reviews/review-1', { method: 'DELETE' });
    await DELETE(request, createContext('review-1'));

    expect(mockKv.srem).toHaveBeenCalledWith('games:reviewed', 'meu-jogo');
  });

  it('deve rejeitar com 401 sem autenticação', async () => {
    mockGetServerSession.mockResolvedValue(null as never);

    const request = new NextRequest('http://localhost/api/reviews/review-1', { method: 'DELETE' });
    const response = await DELETE(request, createContext('review-1'));

    expect(response.status).toBe(401);
  });

  it('deve rejeitar com 403 ao tentar apagar review de outro usuário', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user2', name: 'Outro' },
    } as never);
    (mockKv.get as jest.Mock).mockResolvedValue({
      id: 'review-1',
      userId: 'user1',
      gameSlug: 'meu-jogo',
    });

    const request = new NextRequest('http://localhost/api/reviews/review-1', { method: 'DELETE' });
    const response = await DELETE(request, createContext('review-1'));

    expect(response.status).toBe(403);
  });
});
