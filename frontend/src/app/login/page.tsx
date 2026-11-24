import React, { Suspense } from 'react';
import { AuthView } from '@/components/auth/AuthView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masuk ke Akun | ENSTEINSTORE',
  description: 'Masuk ke akun ENSTEINSTORE untuk kemudahan belanja material jas hujan dan konveksi di Kebumen.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[100dvh] bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin" />
        </div>
      }
    >
      <AuthView initialMode="login" />
    </Suspense>
  );
}
