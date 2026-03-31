// src/app/api/rawg/route.ts
// Proxy seguro para a RAWG API — mantém a API key no servidor

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RAWG_API_KEY não configurada.' }, { status: 500 });
  }

  try {
    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(q)}&page_size=8&ordering=-rating`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`RAWG Error: ${res.status}`);

    const data = await res.json();
    const results = (data.results || []).map((g: { id: number; name: string; background_image: string | null }) => ({
      id: g.id,
      name: g.name,
      coverUrl: g.background_image || null,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('RAWG proxy error:', err);
    return NextResponse.json({ error: 'Falha ao buscar jogos.' }, { status: 500 });
  }
}
