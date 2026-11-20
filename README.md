# ENSTEINSTORE 🌧️🧵

> **E-Commerce & Sales Management Web Application — Toko Enstein**  
> *"Your Trusted Store for Rainwear Materials and Accessories."*

---

## 📌 Tentang Project

**ENSTEINSTORE** adalah aplikasi web e-commerce dan manajemen penjualan terintegrasi yang dirancang untuk mendigitalkan proses bisnis **Toko Enstein** — toko retail spesialis penyedia bahan baku pembuatan jas hujan (kain/material PVC, parasit, mikron) beserta perlengkapan dan aksesoris konveksi pendukungnya (kancing jepret, resleting/zipper waterproof, karet elastik, tali hoodie, lobi-lobi/stopper, skotlet reflektif, hingga lem silen mantel).

Project ini dikembangkan sebagai **Final Project Semester 3** untuk mata kuliah **Pemrograman Berorientasi Objek (PBO)** dan **Basis Data** oleh **Kelompok 05**.

---

## ✨ Fitur Utama

Sistem memiliki dua antarmuka terintegrasi:

### 🛍️ 1. Client Side (Customer Portal)
- **Katalog Produk Dinamis**: Eksplorasi produk bahan dan alat konveksi jas hujan dengan informasi stok real-time, varian warna/ukuran, dan spesifikasi teknis.
- **Pencarian & Filter Kategori**: Filter instan berdasarkan kategori (Bahan PVC, Aksesoris & Alat, dll.) dan pencarian kata kunci.
- **Shopping Cart & Drawer Interaktif**: Pengelolaan kuantitas item, perhitungan total belanja otomatis.
- **Sistem Checkout & Pembayaran**: Alur checkout terstruktur dengan ringkasan pesanan, pemilihan metode pembayaran (Transfer Bank, QRIS), dan upload bukti transfer.
- **Tracking & Riwayat Pesanan**: Pelacakan status pemesanan pelanggan (*Menunggu Pembayaran*, *Diproses*, *Dikirim*, *Selesai*).
- **Profil Pengguna**: Pengelolaan data alamat pengiriman dan akun pelanggan.

### 📊 2. Admin & Owner Management (Back-Office)
- **Executive Dashboard**: Ringkasan omzet penjualan, grafik tren transaksi, jumlah pesanan aktif, dan status inventaris toko.
- **Katalog & Manajemen Produk**: Tambah, edit, hapus, dan atur status aktif/nonaktif produk beserta variannya.
- **Manajemen Kategori**: Pengelompokan jenis barang toko secara fleksibel.
- **Kontrol Inventaris & Mutasi Stok**: Pencatatan barang masuk (*restock*), barang keluar (*sales*), dan penyesuaian stok (*stock opname/adjustment*).
- **Verifikasi Pembayaran**: Pengecekan bukti transfer dan konfirmasi status pembayaran pesanan online.
- **Point of Sale (POS) Offline**: Modul kasir pencatatan transaksi langsung bagi pelanggan yang datang berbelanja di toko fisik.
- **Laporan Keuangan & Penjualan**: Laporan periodik penjualan online & offline, analitik produk terlaris, dan rekapitulasi laba/omzet.

---

## 🛠️ Tech Stack

### Frontend (Saat Ini)
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router Architecture)
- **Library**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Utilities**: `clsx`, `tailwind-merge`

### Backend & Database (Sesuai Rancangan Arsitektur PRD)
- **Backend**: Java 25 LTS + Spring Boot 4.x + Maven (RESTful API Architecture)
- **Database**: PostgreSQL 18.x via Docker + Flyway Migration
- **Spesifikasi & Dokumen**: Selengkapnya terdapat pada [PRD.md](PRD.md)

---

## 📂 Struktur Direktori

```plaintext
ENSTEINSTORE/
├── PRD.md                 # Product Requirement Document lengkap (SRS, BR, ERD, Arsitektur)
├── README.md              # Dokumentasi umum proyek
├── public/                # Asset gambar produk, banner, dan logo toko
└── frontend/              # Source code aplikasi Next.js
    ├── public/            # Static assets untuk frontend
    ├── src/
    │   ├── app/           # App Router (Client & Admin Pages)
    │   │   ├── about/     # Halaman tentang Toko Enstein
    │   │   ├── admin/     # Portal manajemen & dashboard admin
    │   │   ├── auth/      # Autentikasi (Login / Register)
    │   │   ├── cart/      # Halaman keranjang belanja
    │   │   ├── checkout/  # Alur checkout pesanan
    │   │   ├── orders/    # Detail & riwayat pesanan
    │   │   ├── products/  # Katalog & detail produk
    │   │   └── profile/   # Profil pengguna
    │   ├── components/    # Reusable UI Components
    │   │   ├── admin/     # Komponen admin (Dashboard, Orders, Inventory, POS, dll)
    │   │   └── store/     # Komponen toko (Navbar, Footer, Hero, ProductCard, dll)
    │   ├── data/          # Mock data & initial datasets
    │   ├── lib/           # Utility functions & helpers
    │   └── types/         # TypeScript type definitions
    ├── package.json       # Frontend dependencies & scripts
    ├── tailwind.config.js # Konfigurasi Tailwind CSS
    └── tsconfig.json      # Konfigurasi TypeScript
```

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18.18 atau lebih baru
- Package manager: `npm`, `yarn`, atau `pnpm`

### Instalasi & Menjalankan Frontend

1. **Clone repository ini**:
   ```bash
   git clone https://github.com/heyimflh/ENSTEINSTORE.git
   cd ENSTEINSTORE
   ```

2. **Masuk ke folder frontend dan install dependensi**:
   ```bash
   cd frontend
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```

4. **Buka aplikasi di browser**:
   - Customer Portal: [http://localhost:3000](http://localhost:3000)
   - Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 👥 Tim Pengembang (Kelompok 05)

Dikembangkan dengan dedikasi untuk Toko Enstein dan pemenuhan tugas besar Semester 3.

---

## 📄 Lisensi & Hak Cipta

Hak Cipta © 2026 Toko Enstein & Kelompok 05. All rights reserved.
