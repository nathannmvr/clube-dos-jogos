/**
 * @jest-environment node
 */
// src/app/api/games/route.test.ts

import { NextRequest } from 'next/server';

// --- MOCKS (must be declared before jest.mock for hoisting) ---
jest.mock('@/lib/kv', () => ({
  kv: {
    exists: jest.fn(),
    set: jest.fn(),
    sadd: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

import { POST } from './route';
import { kv } from '@/lib/kv';
import { getServerSession } from 'next-auth';

const mockKv = kv as jest.Mocked<typeof kv>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

// Helper to create a NextRequest
function createRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/games', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = 'admin@test.com';
  });

  it('deve criar um jogo com sucesso quando o admin está autenticado', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'admin@test.com' },
    } as never);
    (mockKv.exists as jest.Mock).mockResolvedValue(0);
    (mockKv.set as jest.Mock).mockResolvedValue('OK');
    (mockKv.sadd as jest.Mock).mockResolvedValue(1);

    const response = await POST(createRequest({ title: 'Meu Jogo' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.game.title).toBe('Meu Jogo');
    expect(data.game.slug).toBe('meu-jogo');
    expect(mockKv.set).toHaveBeenCalledWith('game:meu-jogo', expect.objectContaining({ title: 'Meu Jogo', slug: 'meu-jogo' }));
    expect(mockKv.sadd).toHaveBeenCalledWith('games:all', 'meu-jogo');
  });

  it('deve rejeitar com 403 se o usuário não for admin', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'user@test.com' },
    } as never);

    const response = await POST(createRequest({ title: 'Teste' }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('deve rejeitar com 403 se não houver sessão', async () => {
    mockGetServerSession.mockResolvedValue(null as never);

    const response = await POST(createRequest({ title: 'Teste' }));
    expect(response.status).toBe(403);
  });

  it('deve rejeitar com 400 se o título for inválido', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'admin@test.com' },
    } as never);

    const response = await POST(createRequest({ title: '' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('deve rejeitar com 409 se o jogo já existir', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'admin@test.com' },
    } as never);
    (mockKv.exists as jest.Mock).mockResolvedValue(1);

    const response = await POST(createRequest({ title: 'Jogo Existente' }));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
  });
});
