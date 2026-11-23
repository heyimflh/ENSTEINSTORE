# ENSTEINSTORE — Dokumentasi Normalisasi Basis Data (1NF, 2NF, 3NF, BCNF)

Dokumen ini memvalidasi kepatuhan desain basis data ENSTEINSTORE terhadap bentuk normalisasi 1NF, 2NF, 3NF, dan BCNF sesuai standar akademik dan spesifikasi PRD §13.

---

## 1. First Normal Form (1NF)
**Syarat 1NF:**
- Setiap tabel memiliki Primary Key unik.
- Setiap kolom memuat nilai atomik (indivisible).
- Tidak ada grup kolom berulang (*repeating groups*).

**Analisis Evaluasi:**
- Seluruh tabel menggunakan `UUID` (atau `VARCHAR(36)` / `DATE` untuk counters) sebagai Primary Key.
- Nilai alamat dipisahkan (`address`, `city` di `customers`), rincian pesanan disimpan dalam relasi 1:N di tabel `order_items` (bukan array string atau JSON bertingkat).
- Tidak ada kolom multivariat. Setiap tuple bernilai tunggal.
- **Kesimpulan: LULUS 1NF.**

---

## 2. Second Normal Form (2NF)
**Syarat 2NF:**
- Memenuhi 1NF.
- Tidak ada ketergantungan parsial (*partial functional dependency*): setiap atribut non-kunci harus bergantung penuh secara fungsional (*fully functionally dependent*) pada seluruh bagian dari Primary Key.

**Analisis Evaluasi:**
- Seluruh Primary Key adalah kunci tunggal (Single-attribute PK berupa `id UUID`), kecuali `order_number_counters` (`order_date DATE`).
- Karena semua entitas utama ber-PK kolom tunggal, secara matematis ketergantungan parsial tidak mungkin terjadi (*no partial key dependency is possible on a single-column primary key*).
- Pada tabel detail relasional (`cart_items`, `order_items`), PK tetap kolom tunggal `id UUID` dengan constraint unik komposit `UNIQUE(order_id, product_id)`.
- Atribut snapshot pada `order_items` (`product_name`, `unit_symbol`, `unit_price`, `quantity`, `subtotal`) bergantung pada item pesanan spesifik tersebut pada momen transaksi, bukan pada tabel produk master.
- **Kesimpulan: LULUS 2NF.**

---

## 3. Third Normal Form (3NF)
**Syarat 3NF:**
- Memenuhi 2NF.
- Tidak ada ketergantungan transitif (*transitive functional dependency*): atribut non-kunci tidak boleh bergantung pada atribut non-kunci lainnya ($X \to Y$ di mana $Y$ bukan superkey).

**Analisis Evaluasi:**
1. **Domain User & Autentikasi:**
   - `users (id -> email, password_hash, role, ...)`
   - Atribut khusus customer (`address, city`) dipisahkan ke tabel `customers` yang berelasi 1:1 via FK `id -> users.id`.
   - Tidak ada transitivitas dalam `users` atau `customers`.
2. **Katalog Produk:**
   - `products (id -> category_id, unit_id, price, ...)`
   - Nama kategori dan simbol unit tidak disimpan di `products`, melainkan direferensikan via `category_id -> categories.id` dan `unit_id -> units.id`.
3. **Pesanan & Snapshot Data:**
   - Mengapa `order_items` menyimpan `product_name`, `product_code`, dan `unit_symbol`?
   - **Justifikasi Historis/Audit (Historical Accuracy):** Ini bukan ketergantungan transitif redundan, melainkan pencatatan nilai historis (*historical point-in-time value snapshot*). Jika nama produk diubah di masa depan, faktur masa lalu tidak boleh terpengaruh.
   - Perhitungan matematis: `subtotal = quantity * unit_price` divalidasi oleh trigger PostgreSQL `fn_validate_order_items_subtotal()`.
4. **Kesimpulan: LULUS 3NF.**

---

## 4. Boyce-Codd Normal Form (BCNF)
**Syarat BCNF:**
- Untuk setiap ketergantungan fungsional non-trivial $X \to Y$, $X$ harus merupakan Super Key (*candidate key*).

**Analisis Evaluasi:**
- Pada setiap tabel:
  - `users`: Penentu determinan adalah `id` (PK) atau `email` (Candidate Key unik). Keduanya adalah Super Key.
  - `products`: Determinan adalah `id` (PK) atau `product_code` (Candidate Key unik). Keduanya Super Key.
  - `orders`: Determinan adalah `id` (PK) atau `order_number` (Candidate Key unik).
  - `payments`: Determinan adalah `id` (PK) atau `order_id` (Candidate Key unik BR-05).
  - `categories`: Determinan adalah `id` (PK), `name` (UK), atau `slug` (UK).
  - `units`: Determinan adalah `id` (PK), `unit_name` (UK), atau `unit_symbol` (UK).
- Tidak ada ketergantungan fungsional non-trivial yang determinasinya bukan superkey.
- **Kesimpulan: LULUS BCNF.**
