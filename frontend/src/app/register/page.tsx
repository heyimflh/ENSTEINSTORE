import React, { Suspense } from 'react';
import { AuthView } from '@/components/auth/AuthView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Akun Baru | ENSTEINSTORE',
  description: 'Daftar akun pelanggan atau mitra konveksi di ENSTEINSTORE Kebumen.',
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[100dvh] bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin" />
        </div>
      }
    >
      <AuthView initialMode="register" />
    </Suspense>
  );
}
