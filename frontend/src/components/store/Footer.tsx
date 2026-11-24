'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ShieldCheck, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white py-16 border-t border-zinc-200 text-zinc-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-zinc-100">
          
          {/* Col 1: Store Information (Toko Enstein) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-zinc-100 p-1 flex items-center justify-center shrink-0 border border-zinc-200">
                <img
                  src="/ensteinlogo.png"
                  alt="Logo Toko Enstein"
                  width={36}
                  height={36}
                  style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 uppercase">
                ENSTEIN<span className="text-amber-500 font-bold">STORE</span>
              </span>
            </Link>

            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
              <strong className="text-zinc-700 font-semibold">Toko Enstein</strong> — Berlokasi di Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01). Bergerak di bidang penjualan bahan jas hujan (kain PVC, balon, taslan, mika) beserta komponen pendukung konveksi seperti kancing, resleting, dan karet elastis untuk partai besar maupun eceran.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-zinc-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Kualitas Standar Konveksi &amp; Eceran • Stok Real-Time</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Navigasi
            </h3>
            <ul className="space-y-2.5 text-xs text-zinc-500">
              <li>
                <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-zinc-900 transition-colors">Katalog Produk</Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-zinc-900 transition-colors">Kategori Bahan</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-zinc-900 transition-colors">Tentang Toko</Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-zinc-900 transition-colors">Pesanan Saya</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: 5 Categories Links */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              5 Kategori Bahan
            </h3>
            <ul className="space-y-2.5 text-xs text-zinc-500">
              <li>
                <Link href="/products?category=material-jas-hujan" className="hover:text-zinc-900 transition-colors">
                  1. Material Jas Hujan
                </Link>
              </li>
              <li>
                <Link href="/products?category=resleting" className="hover:text-zinc-900 transition-colors">
                  2. Resleting
                </Link>
              </li>
              <li>
                <Link href="/products?category=kancing" className="hover:text-zinc-900 transition-colors">
                  3. Kancing
                </Link>
              </li>
              <li>
                <Link href="/products?category=karet" className="hover:text-zinc-900 transition-colors">
                  4. Karet
                </Link>
              </li>
              <li>
                <Link href="/products?category=aksesori" className="hover:text-zinc-900 transition-colors">
                  5. Aksesori
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Details (Toko Enstein) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Kontak &amp; Alamat Toko
            </h3>
            <ul className="space-y-2.5 text-xs text-zinc-500">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01), Jawa Tengah</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <a
                  href="https://wa.me/6283876942484"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-900 hover:text-amber-600 transition-colors"
                >
                  WhatsApp: +62 838 7694 2484
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Email: sales@ensteinstore.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Senin - Sabtu: 08.00 - 17.00 WIB</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            <p>© 2026 ENSTEINSTORE (Toko Enstein). All rights reserved.</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Penyedia Bahan Jas Hujan &amp; Komponen Konveksi Berkualitas • Kebumen, Jawa Tengah
            </p>
          </div>

          {/* Scroll to Top */}
          <button
            type="button"
            onClick={scrollToTop}
            className="p-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 transition-colors border border-zinc-200 focus:outline-none"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </footer>
  );
};
