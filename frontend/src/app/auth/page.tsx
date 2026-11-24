'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthView } from '@/components/auth/AuthView';

function AuthContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const initialMode = modeParam === 'register' ? 'register' : 'login';

  return <AuthView initialMode={initialMode} />;
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[100dvh] bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
