import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ENSTEINSTORE | Toko Bahan Jas Hujan & Komponen Pendukung Terpercaya',
  description:
    'Toko Enstein berlokasi di Jl. Kertanegara Km. 03, Tanahsari, Kebumen. Spesialis penjualan bahan jas hujan (kain/material) beserta komponen pendukungnya seperti kancing, resleting, dan karet.',
  keywords: [
    'jas hujan',
    'kain pvc balon',
    'resleting waterproof',
    'kancing snap',
    'karet elastis',
    'toko enstein',
    'toko enstein kebumen',
    'tanahsari kebumen',
  ],
  icons: {
    icon: '/ensteinlogo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FDFBF7] text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
