import { kv } from '@/lib/kv';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, isFavorite: false });
  }

  const { slug } = await params;
  const isFavorited = await kv.sismember(`user:${session.user.id}:favorites`, slug);
  return NextResponse.json({ success: true, isFavorite: isFavorited === 1 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  await kv.sadd(`user:${session.user.id}:favorites`, slug);
  return NextResponse.json({ success: true, isFavorite: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  await kv.srem(`user:${session.user.id}:favorites`, slug);
  return NextResponse.json({ success: true, isFavorite: false });
}
