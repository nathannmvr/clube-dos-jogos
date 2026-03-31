/**
 * @jest-environment node
 */
// src/app/api/games/[slug]/route.test.ts

import { NextRequest } from 'next/server';

jest.mock('@/lib/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    lrange: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

import { PUT, DELETE } from './route';
import { kv } from '@/lib/kv';
import { getServerSession } from 'next-auth';

const mockKv = kv as jest.Mocked<typeof kv>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

function createContext(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe('PUT /api/games/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = 'admin@test.com';
  });

  it('deve atualizar o título do jogo com sucesso', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } } as never);
    (mockKv.get as jest.Mock).mockResolvedValue({ title: 'Antigo', slug: 'meu-jogo' });
    (mockKv.set as jest.Mock).mockResolvedValue('OK');
    (mockKv.lrange as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/games/meu-jogo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Novo Título' }),
    });

    const response = await PUT(request, createContext('meu-jogo'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockKv.set).toHaveBeenCalledWith('game:meu-jogo', expect.objectContaining({ title: 'Novo Título' }));
  });

  it('deve rejeitar com 403 se não for admin', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'user@test.com' } } as never);

    const request = new NextRequest('http://localhost/api/games/meu-jogo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Novo' }),
    });

    const response = await PUT(request, createContext('meu-jogo'));
    expect(response.status).toBe(403);
  });

  it('deve rejeitar com 404 se o jogo não existir', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } } as never);
    (mockKv.get as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/games/inexistente', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Novo' }),
    });

    const response = await PUT(request, createContext('inexistente'));
    expect(response.status).toBe(404);
  });

  it('deve atualizar título nas reviews associadas', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } } as never);
    (mockKv.get as jest.Mock)
      .mockResolvedValueOnce({ title: 'Antigo', slug: 'meu-jogo' })
      .mockResolvedValueOnce({ gameTitle: 'Antigo', userId: 'u1' });
    (mockKv.set as jest.Mock).mockResolvedValue('OK');
    (mockKv.lrange as jest.Mock).mockResolvedValue(['review-1']);

    const request = new NextRequest('http://localhost/api/games/meu-jogo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Novo Título' }),
    });

    await PUT(request, createContext('meu-jogo'));

    expect(mockKv.set).toHaveBeenCalledWith('review:review-1', expect.objectContaining({ gameTitle: 'Novo Título' }));
  });
});

describe('DELETE /api/games/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = 'admin@test.com';
  });

  it('deve apagar jogo e todas as reviews associadas', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } } as never);
    (mockKv.lrange as jest.Mock).mockResolvedValue(['review-1']);
    (mockKv.get as jest.Mock).mockResolvedValue({ userId: 'user1', gameSlug: 'meu-jogo' });
    (mockKv.del as jest.Mock).mockResolvedValue(1);
    (mockKv.srem as jest.Mock).mockResolvedValue(1);

    const request = new NextRequest('http://localhost/api/games/meu-jogo', { method: 'DELETE' });
    const response = await DELETE(request, createContext('meu-jogo'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockKv.del).toHaveBeenCalledWith('game:meu-jogo');
    expect(mockKv.srem).toHaveBeenCalledWith('games:all', 'meu-jogo');
  });

  it('deve rejeitar com 403 se não for admin', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'user@test.com' } } as never);

    const request = new NextRequest('http://localhost/api/games/meu-jogo', { method: 'DELETE' });
    const response = await DELETE(request, createContext('meu-jogo'));
    expect(response.status).toBe(403);
  });
});
