'use client';

import React from 'react';
import { STORE_INFO } from '../../data/mock-data';
import { MapPin, Phone, Mail, Clock, ShieldCheck, CreditCard, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-stone-300 pt-16 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
          
          {/* Col 1: Store Information (Toko Enstein) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-stone-200">
                <img src="/ensteinlogo.png" alt="Logo Toko Enstein" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold font-serif text-white tracking-tight">
                ENSTEIN<span className="text-amber-400">STORE</span>
              </span>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              <strong className="text-stone-200">Toko Enstein</strong> — Berlokasi di Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01). Bergerak di bidang penjualan bahan jas hujan (kain/material) beserta komponen pendukungnya seperti kancing, resleting, dan karet untuk konveksi maupun eceran.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-amber-400/90 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Satu Database Terintegrasi • Stok Real-Time</span>
            </div>
          </div>

          {/* Col 2: Quick Links (Navigasi) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-serif">
              Navigasi Cepat
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:text-amber-400 transition-colors">Home</a>
              </li>
              <li>
                <a href="#products-section" className="hover:text-amber-400 transition-colors">Katalog Produk</a>
              </li>
              <li>
                <a href="#categories-section" className="hover:text-amber-400 transition-colors">Kategori Bahan</a>
              </li>
              <li>
                <a href="#about-section" className="hover:text-amber-400 transition-colors">Tentang Toko Enstein</a>
              </li>
              <li>
                <a href="#orders-section" className="hover:text-amber-400 transition-colors">Pesanan Saya (Tracking)</a>
              </li>
            </ul>
          </div>

          {/* Col 3: 5 Categories Links */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-serif">
              5 Kategori Bahan
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#categories-section" className="hover:text-amber-400 transition-colors">1. Material Jas Hujan (PVC &amp; Balon)</a>
              </li>
              <li>
                <a href="#categories-section" className="hover:text-amber-400 transition-colors">2. Resleting (Waterproof &amp; Coil)</a>
              </li>
              <li>
                <a href="#categories-section" className="hover:text-amber-400 transition-colors">3. Kancing (Snap Button Plastik)</a>
              </li>
              <li>
                <a href="#categories-section" className="hover:text-amber-400 transition-colors">4. Karet (Elastis Pinggang &amp; Tangan)</a>
              </li>
              <li>
                <a href="#categories-section" className="hover:text-amber-400 transition-colors">5. Aksesori (Seam Sealing Tape &amp; Stopper)</a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Details (Toko Enstein) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-serif">
              Kontak &amp; Alamat Toko
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{STORE_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>WhatsApp / Telp: {STORE_INFO.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Email: {STORE_INFO.email}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{STORE_INFO.hours}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Payment Methods, Policies & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            <p>© 2026 ENSTEINSTORE (Toko Enstein). All rights reserved.</p>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Kelompok 05 — Tugas Akhir Pemrograman Berorientasi Objek &amp; Basis Data Semester 3.
            </p>
          </div>

          {/* Supported Payment Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-stone-400 font-medium">Metode Pembayaran:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-stone-300">Transfer Bank</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-stone-300">E-Wallet</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-stone-300">Cash on Pickup</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">Simulasi Demo</span>
          </div>

          {/* Scroll to Top */}
          <button
            onClick={scrollToTop}
            className="p-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 transition-colors border border-slate-800 focus:outline-none"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </footer>
  );
};
