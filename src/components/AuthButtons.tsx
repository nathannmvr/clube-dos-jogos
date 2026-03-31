// src/components/AuthButtons.tsx
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div style={{ width: '80px', height: '36px', background: '#1a1a3a', animation: 'pulse 1.5s infinite' }} className="animate-pulse" />;
  }

  if (session && session.user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/user/${session.user.id}`} title="Minhas Reviews">
          {session.user.image ? (
            <div style={{ border: '2px solid #39ff14', display: 'inline-block', boxShadow: '0 0 8px rgba(57,255,20,0.5)' }}>
              <Image
                src={session.user.image}
                alt={session.user.name || 'Avatar'}
                width={36}
                height={36}
                style={{ display: 'block' }}
              />
            </div>
          ) : (
            <div style={{
              width: '36px', height: '36px', background: '#1a1a3a',
              border: '2px solid #39ff14', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Press Start 2P'", fontSize: '10px', color: '#39ff14',
            }}>
              {(session.user.name || 'U')[0].toUpperCase()}
            </div>
          )}
        </Link>
        <button
          onClick={() => signOut()}
          className="btn-pixel btn-pixel-red"
          style={{ fontSize: '8px' }}
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="btn-pixel btn-pixel-green"
      style={{ fontSize: '8px' }}
    >
      ▶ LOGIN
    </button>
  );
}