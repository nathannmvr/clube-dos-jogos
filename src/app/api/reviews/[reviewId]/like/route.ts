import { kv } from '@/lib/kv';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { reviewId } = await params;
  await kv.sadd(`review:${reviewId}:likes`, session.user.id);
  const likesCount = await kv.scard(`review:${reviewId}:likes`);
  
  return NextResponse.json({ success: true, likesCount });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { reviewId } = await params;
  await kv.srem(`review:${reviewId}:likes`, session.user.id);
  const likesCount = await kv.scard(`review:${reviewId}:likes`);
  
  return NextResponse.json({ success: true, likesCount });
}
