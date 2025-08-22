// src/components/AuthButtons.tsx
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="w-24 h-10 bg-slate-700 rounded-md animate-pulse" />;
  }
  
  if (session) {
    return (
      <div className="flex items-center gap-3">
        {session.user?.image && (
          <Image src={session.user.image} alt={session.user.name || 'Avatar'} width={40} height={40} className="rounded-full" />
        )}
        <button onClick={() => signOut()} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md">
          Sair
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => signIn('google')} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md">
      Login
    </button>
  );
}