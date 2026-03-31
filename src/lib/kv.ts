// src/lib/kv.ts
// Cliente KV centralizado que usa as variáveis de ambiente com prefixo "clubedoscria_"

import { createClient } from '@vercel/kv';

export const kv = createClient({
  url: process.env.clubedoscria_KV_REST_API_URL!,
  token: process.env.clubedoscria_KV_REST_API_TOKEN!,
});
