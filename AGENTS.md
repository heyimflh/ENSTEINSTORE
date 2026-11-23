# AGENTS.md — Engineering & AI Coding Agent Guidelines

PROJECT: ENSTEINSTORE
TYPE: E-Commerce & Sales Management Web Application (Single-Seller) — Toko Enstein
STACK: Java 25 LTS, Spring Boot 4.1.x, PostgreSQL 18, Next.js 15, TypeScript, Tailwind CSS

---

## 1. Arsitektur Tiga Lapisan (Strict Three-Tier)

- **Presentation Layer:** Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, Zod.
- **Application Layer:** Java 25 LTS + Spring Boot 4.1.x (Controller -> Service -> Repository -> Entity).
- **Data Layer:** PostgreSQL 18 via Docker / Local, Flyway migrations (V1–V13), Triggers, Stored Procedures, Views.

---

## 2. Sepuluh Aturan Utama (PRD §21.1)

1. **All business logic must be implemented in Java.** Frontend adalah presentation layer semata. Seluruh perhitungan harga, validasi stok, penentuan status, dan otorisasi dilakukan otoritatif di backend.
2. **Frontend communicates with backend exclusively through REST API.** Komunikasi format JSON camelCase, standar error K14, dan status code HTTP semantik.
3. **Frontend must not directly access database credentials.** Tidak ada panggilan langsung dari browser/Next.js server-side ke port database atau Supabase direct API untuk alur bisnis inti.
4. **Use BigDecimal for monetary and stock calculations.** Dilarang menggunakan `double` atau `float` untuk mata uang dan kuantitas (PRD §13.5).
5. **Use database transactions for checkout and payments.** Anotasi `@Transactional` diletakkan di layer Service. Operasi checkout, konfirmasi pembayaran, dan offline sales wajib berjalan dalam satu transaksi ACID atomik.
6. **Use Flyway for database migrations.** `spring.jpa.hibernate.ddl-auto=validate`. Dilarang keras menggunakan `create` atau `update`.
7. **Do not duplicate stock update logic.** Java TIDAK PERNAH meng-update kolom `products.stock_on_hand` atau `reserved_quantity` secara langsung. Satu-satunya pintu mutasi stok adalah `INSERT INTO stock_movements` melalui `InventoryService` (single choke point), yang memicu trigger PostgreSQL `trg_apply_stock_movement`.
8. **Write tests for core business operations.** Setiap operasi inti (kalkulasi cart/order, reservasi stok, checkout, rollback, pembatalan, pembayaran, laporan) wajib memiliki unit/integration test (JUnit 5 + Testcontainers PostgreSQL 18).
9. **Follow existing project architecture.** Jaga modularitas package: `config/`, `security/`, `entity/`, `dto/`, `controller/`, `service/`, `repository/`, `payment/`, `exporter/`, `exception/`, `util/`. Entity JPA tidak pernah dikembalikan langsung ke controller (selalu mapping via DTO).
10. **Document API contracts and database changes.** Setiap perubahan endpoint didokumentasikan di OpenAPI/Swagger dan `docs/api-documentation.md`. Setiap keputusan teknis dicatat di `docs/DECISIONS.md`.

---

## 3. Larangan Mutlak (Strict Prohibitions)

- **DILARANG** mengaktifkan `hibernate.ddl-auto=create` atau `update`.
- **DILARANG** menggunakan H2 in-memory database untuk testing. Trigger, Stored Procedure, Function, dan View PostgreSQL harus diuji di PostgreSQL sungguhan (Testcontainers).
- **DILARANG** menulis mutasi stok langsung di luar `stock_movements`.
- **DILARANG** memperluas scope ke luar PRD §4.2 (seperti gateway pembayaran pihak ketiga riil, API kurir JNE/J&T, notifikasi WhatsApp/SMS bot, sistem payroll/akuntansi lengkap).
- **DILARANG** menyimpan secret atau password di dalam repository atau file komit git. Gunakan environment variables (`.env`).
- **DILARANG** membocorkan entity JPA ke client atau menerima entity JPA sebagai request body (mencegah Mass Assignment vulnerability).
- **DILARANG** menonaktifkan CSRF/CORS/Security check sebagai jalan pintas.
- **DILARANG** melanjutkan pengerjaan fase berikutnya sebelum kriteria Gate fase aktif selesai, teruji, dan disetujui oleh pengguna.

---

## 4. Pola Implementasi Wajib (Code Conventions)

- **OOP Patterns (PRD §19.1):**
  - Inheritance: `abstract class User` -> `Customer`, `Admin` (`getRole()` polimorfik).
  - Strategy Pattern: `PaymentProcessor` interface -> `ManualTransferProcessor`, `SimulatedPaymentProcessor`, `CashPaymentProcessor`.
  - Strategy Pattern: `ReportExporter` interface -> `CsvReportExporter` (File I/O Java aman dari CSV Injection).
  - State Machine: `OrderStateMachine` sebagai single source of truth untuk transisi status order.
- **Multithreading:** `DashboardService` mengeksekusi 3 query ringkasan (Sales, Stock, Recent Orders) secara paralel menggunakan `CompletableFuture` dengan pool executor terkelola, masing-masing dengan transaksi read-only independen.
- **Anti-Race Condition:**
  - Kunci baris produk `PESSIMISTIC_WRITE` terurut berdasarkan ID saat checkout untuk mencegah deadlock.
  - Penomoran pesanan unik format `EST-YYYYMMDD-XXXX` menggunakan tabel `order_number_counters` dengan query atomik `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`.
  - Idempotency guard pada verifikasi pembayaran (`FOR UPDATE` pada payment row).
- **Error Handling (K14):**
  - Gunakan `@RestControllerAdvice` global.
  - Format respon: `timestamp`, `status`, `error`, `code` (UPPER_SNAKE), `message` (Bahasa Indonesia), `path`, dan `fieldErrors` jika validasi bean gagal.
