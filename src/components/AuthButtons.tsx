// src/components/AuthButtons.tsx
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link'; // Importe o componente Link

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="w-24 h-10 bg-slate-700 rounded-md animate-pulse" />;
  }
  
  if (session && session.user) {
    return (
      <div className="flex items-center gap-3">
        {/* Envolva a Imagem com o componente Link */}
        <Link href={`/user/${session.user.id}`} title="Minhas Reviews">
          {session.user.image && (
            <Image 
              src={session.user.image} 
              alt={session.user.name || 'Avatar'} 
              width={40} 
              height={40} 
              className="rounded-full border-2 border-transparent hover:border-cyan-400 transition-colors" 
            />
          )}
        </Link>
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