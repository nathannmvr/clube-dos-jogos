/**
 * @jest-environment node
 */
// src/app/api/reviews/route.test.ts

import { NextRequest } from 'next/server';

jest.mock('@/lib/kv', () => ({
  kv: {
    exists: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    lpush: jest.fn(),
    sadd: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('nanoid', () => ({
  nanoid: () => 'test-review-id',
}));

import { POST, PUT } from './route';
import { kv } from '@/lib/kv';
import { getServerSession } from 'next-auth';

const mockKv = kv as jest.Mocked<typeof kv>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

function createRequest(method: string, body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/reviews', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validReviewData = {
  gameTitle: 'Meu Jogo',
  gameSlug: 'meu-jogo',
  horasJogadas: 10,
  notaFinal: 8,
  scores: {
    jogabilidade: 8, arte: 7, trilhaSonora: 9, diversao: 8,
    rejogabilidade: 7, graficos: 8, complexidade: 6, lore: 9,
  },
};

describe('POST /api/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar uma review com sucesso', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user1', name: 'Test User', image: null },
    } as never);
    (mockKv.exists as jest.Mock).mockResolvedValue(0);
    (mockKv.set as jest.Mock).mockResolvedValue('OK');
    (mockKv.lpush as jest.Mock).mockResolvedValue(1);
    (mockKv.sadd as jest.Mock).mockResolvedValue(1);

    const response = await POST(createRequest('POST', validReviewData));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.review.gameTitle).toBe('Meu Jogo');
    expect(data.review.userId).toBe('user1');
    expect(mockKv.set).toHaveBeenCalledWith('review:test-review-id', expect.any(Object));
    expect(mockKv.lpush).toHaveBeenCalledWith('reviews_for_game:meu-jogo', 'test-review-id');
  });

  it('deve rejeitar com 401 se não estiver autenticado', async () => {
    mockGetServerSession.mockResolvedValue(null as never);

    const response = await POST(createRequest('POST', validReviewData));
    expect(response.status).toBe(401);
  });

  it('deve rejeitar com 400 se os dados estiverem incompletos', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user1', name: 'Test' },
    } as never);

    const response = await POST(createRequest('POST', { gameTitle: 'Jogo' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('deve rejeitar com 409 se já existir review do usuário para o jogo', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user1', name: 'Test' },
    } as never);
    (mockKv.exists as jest.Mock).mockResolvedValue(1);

    const response = await POST(createRequest('POST', validReviewData));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
  });
});

describe('PUT /api/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve atualizar a review do próprio usuário', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user1', name: 'Test' },
    } as never);
    (mockKv.get as jest.Mock).mockResolvedValue({
      id: 'review-1',
      userId: 'user1',
      gameTitle: 'Jogo',
      gameSlug: 'jogo',
      scores: validReviewData.scores,
      horasJogadas: 5,
      notaFinal: 7,
    });
    (mockKv.set as jest.Mock).mockResolvedValue('OK');

    const response = await PUT(createRequest('PUT', {
      reviewId: 'review-1',
      scores: validReviewData.scores,
      horasJogadas: 15,
      notaFinal: 9,
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockKv.set).toHaveBeenCalledWith('review:review-1', expect.objectContaining({ horasJogadas: 15 }));
  });

  it('deve rejeitar com 403 se tentar editar review de outro usuário', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user2', name: 'Outro' },
    } as never);
    (mockKv.get as jest.Mock).mockResolvedValue({
      id: 'review-1',
      userId: 'user1',
    });

    const response = await PUT(createRequest('PUT', {
      reviewId: 'review-1',
      scores: validReviewData.scores,
      horasJogadas: 10,
      notaFinal: 8,
    }));

    expect(response.status).toBe(403);
  });

  it('deve rejeitar com 401 sem autenticação', async () => {
    mockGetServerSession.mockResolvedValue(null as never);

    const response = await PUT(createRequest('PUT', { reviewId: 'review-1' }));
    expect(response.status).toBe(401);
  });
});
