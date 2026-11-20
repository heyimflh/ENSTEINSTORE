'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Scissors, Award } from 'lucide-react';

interface HeroProps {
  onCtaClick: () => void;
  onExploreCategories: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCtaClick, onExploreCategories }) => {
  return (
    <section className="relative overflow-hidden bg-slate-900 text-stone-100 py-16 md:py-24 border-b border-stone-800">
      {/* Background Decorative Gradient & Rain Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Headline & Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Editorial Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Toko Enstein • Rainwear Material Specialist</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-serif text-white leading-tight">
              ENSTEIN<span className="text-amber-400">STORE</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-stone-300 font-light max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Your Trusted Store for Rainwear Materials and Accessories.
            </p>

            {/* Supporting Copy */}
            <p className="text-sm text-stone-400 max-w-xl mx-auto lg:mx-0 leading-normal">
              Toko Enstein berlokasi di Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01). Bergerak di bidang penjualan bahan jas hujan (kain/material) beserta komponen pendukungnya seperti kancing, resleting, dan karet.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onCtaClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Belanja Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreCategories}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/80 text-stone-200 border border-stone-700 font-semibold text-sm transition-all duration-200"
              >
                <span>Lihat 5 Kategori</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs text-stone-300 font-medium">100% Waterproof</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Scissors className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs text-stone-300 font-medium">Potong Per Meter</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs text-stone-300 font-medium">Eceran &amp; Grosir</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Product Showcase Card */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md bg-gradient-to-b from-slate-800/90 to-slate-900/95 p-6 rounded-3xl border border-stone-700/80 shadow-2xl backdrop-blur-sm">
              
              {/* Product Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
                <span className="text-xs font-semibold tracking-wider uppercase text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  Top Choice 2026
                </span>
                <span className="text-xs text-stone-400 font-mono">Kode: PRD-BHN-001</span>
              </div>

              {/* Product Image Preview */}
              <div className="relative my-4 aspect-[4/3] rounded-2xl overflow-hidden bg-slate-800 border border-slate-700">
                <img
                  src="/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg"
                  alt="PVC Super Ketebalan 0.25"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-medium text-stone-200 border border-stone-700/60">
                  Ketebalan: 0.25 mm
                </div>
              </div>

              {/* Card Meta */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white font-serif">PVC Super Ketebalan 0.25</h2>
                    <p className="text-xs text-stone-400">Pilihan favorit penjahit jas hujan setelan &amp; ponco</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Harga Satuan</p>
                    <p className="text-base font-bold text-amber-400">Rp35.000 <span className="text-xs font-normal text-stone-300">/ m</span></p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center justify-between text-xs">
                  <span className="text-stone-300">Status Persediaan Toko</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ready Stock (125 m)
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
