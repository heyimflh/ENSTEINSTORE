# ENSTEINSTORE — Master Testing Documentation (30/30 Test Cases)

**System:** ENSTEINSTORE (Toko Enstein Web Application)  
**Testing Frameworks:** JUnit 5, Spring Boot Test, MockMvc, Testcontainers PostgreSQL 18, PowerShell E2E Suite  
**Database Guarantee:** Real PostgreSQL 18 Engine (No in-memory mock/H2 DB per PRD Rule #8)  

---

## 1. Strategi Pengujian (Test Strategy)

ENSTEINSTORE menerapkan strategi pengujian berlapis (*Testing Pyramid*) untuk menjamin keandalan sistem e-commerce secara menyeluruh:

1. **Unit Testing:**
   - Memvalidasi logika murni tanpa database: algoritma State Machine transisi status pesanan (`OrderStateMachineTest`) dan sanitasi format proteksi CSV Injection (`CsvReportExporterTest`).
2. **Integration Testing (Spring Boot + Testcontainers PostgreSQL 18):**
   - Menguji interaksi komponen repository, service, security, trigger PostgreSQL, stored procedure, dan transaksi database secara terisolasi pada kontainer Docker PostgreSQL 18 sungguhan (`*IT.java`).
3. **End-to-End (E2E) System Validation:**
   - Menguji 13 skenario lengkap siklus bisnis (Customer register $\rightarrow$ catalog browsing $\rightarrow$ cart $\rightarrow$ checkout $\rightarrow$ payment simulation $\rightarrow$ admin status transition $\rightarrow$ stock-in & adjustment $\rightarrow$ POS cashier sales $\rightarrow$ streaming CSV reports download) melalui antarmuka REST API publik dan terotentikasi.

---

## 2. Matriks Keterlacakan 30 Test Cases (TC-01 s/d TC-30)

Seluruh 30 Test Cases yang disyaratkan dalam PRD §21 dan *Master Implementation Plan* telah dipetakan dan diverifikasi dengan status **100% LULUS**:

| No | Test Case ID | Deskripsi Skenario Uji | Tipe Uji | Kelas & Metode Pengujian | Status |
|---|---|---|:---:|---|:---:|
| 1 | **TC-01** | Registrasi akun baru customer (`ROLE_CUSTOMER`) | Integration | `AuthIntegrationIT.testCustomerRegistration()` |  PASS |
| 2 | **TC-02** | Login customer berhasil & penerbitan Bearer JWT | Integration | `AuthIntegrationIT.testCustomerLogin()` |  PASS |
| 3 | **TC-03** | Login admin berhasil & hak akses `ROLE_ADMIN` | Integration | `AuthIntegrationIT.testAdminLogin()` |  PASS |
| 4 | **TC-04** | Katalog menampilkan produk aktif dengan paginasi | Integration | `CatalogControllerIT.testGetProductsPaged()` |  PASS |
| 5 | **TC-05** | Tambah produk ke keranjang belanja (Cart) | Integration | `CartAndInventoryIT.testAddToCart()` |  PASS |
| 6 | **TC-06** | Ubah kuantitas cart & perhitungan subtotal BigDecimal | Integration | `CartAndInventoryIT.testUpdateCartItemQuantity()` |  PASS |
| 7 | **TC-07** | Hapus item dari keranjang belanja | Integration | `CartAndInventoryIT.testRemoveCartItem()` |  PASS |
| 8 | **TC-08** | Checkout sukses, pesanan dibuat & stok terreservasi | Integration | `CartAndInventoryIT.testCheckoutAtomicStockReservation()` |  PASS |
| 9 | **TC-09** | Checkout melebihi stok ditolak (`INSUFFICIENT_STOCK`) | Integration | `CartAndInventoryIT.testCartRejectsExcessQuantity()` |  PASS |
| 10 | **TC-10** | Verifikasi transfer manual oleh admin $\rightarrow$ status `PAID` | Integration | `OrderAndPaymentIT.testPaymentProofUploadAndApproval()` |  PASS |
| 11 | **TC-11** | Simulasi pembayaran sukses $\rightarrow$ status `PAID` | Integration | `OrderAndPaymentIT.testPaymentSimulation()` |  PASS |
| 12 | **TC-12** | Simulasi pembayaran gagal $\rightarrow$ stok tetap terreservasi | Integration | `OrderAndPaymentIT.testPaymentSimulationOutcomeFailed()` |  PASS |
| 13 | **TC-13** | Pembatalan order pending $\rightarrow$ stok reservasi dilepas | Integration | `OrderAndPaymentIT.testOrderCancellationReleasesStock()` |  PASS |
| 14 | **TC-14** | Admin Stock-In menambah stok fisik via Stored Procedure | Integration | `CartAndInventoryIT.testInventoryStockIn()` |  PASS |
| 15 | **TC-15** | Transaksi kasir offline toko fisik memotong stok seketika | Integration | `OrderAndPaymentIT.testOfflineSaleDirectStockDeduction()` |  PASS |
| 16 | **TC-16** | Dashboard ringkasan paralel via `CompletableFuture` | Integration | `OrderAndPaymentIT.testMultithreadedDashboard()` |  PASS |
| 17 | **TC-17** | Ekspor laporan penjualan ke file CSV berformat UTF-8 | Unit / IT | `CsvReportExporterTest.testCsvExportUtf8Bom()` |  PASS |
| 18 | **TC-18** | Anti-CSV Injection membubuhkan apostrof pada formula | Unit | `CsvReportExporterTest.testAntiCsvInjectionFormulas()` |  PASS |
| 19 | **TC-19** | Akses customer ke endpoint admin ditolak HTTP 403 | Integration | `AuthIntegrationIT.testCustomerForbiddenFromAdminEndpoints()` |  PASS |
| 20 | **TC-20** | Transaksi checkout rollback atomik saat terjadi error | Integration | `CartAndInventoryIT.testCheckoutRollbackOnError()` |  PASS |
| 21 | **TC-21** | Kuantitas desimal pada satuan non-desimal (Pcs) ditolak | Integration | `CartAndInventoryIT.testDecimalQuantityValidation()` |  PASS |
| 22 | **TC-22** | Kuantitas desimal (2.5 meter) pada kain PVC diterima | Integration | `CartAndInventoryIT.testDecimalQuantityValidation()` |  PASS |
| 23 | **TC-23** | Perubahan harga produk tidak mengubah riwayat order lama | Integration | `EntityRepositoryIT.testOrderItemPriceSnapshot()` |  PASS |
| 24 | **TC-24** | Hapus produk yang memiliki relasi order = Soft Delete | Integration | `AdminWorkflowIT.testProductSoftDelete()` |  PASS |
| 25 | **TC-25** | Verifikasi pembayaran ganda idempoten (`FOR UPDATE`) | Integration | `EntityRepositoryIT.testPaymentLocking()` |  PASS |
| 26 | **TC-26** | Penomoran pesanan unik atomik `EST-YYYYMMDD-XXXX` | Integration | `CartAndInventoryIT.testOrderNumberSequence()` |  PASS |
| 27 | **TC-27** | Customer dilarang mengakses data order customer lain | Integration | `CustomerWorkflowIT.testCustomerCrossTenantOrderAccess()` |  PASS |
| 28 | **TC-28** | Penyesuaian stok opname tanpa alasan/notes ditolak | Integration | `AdminWorkflowIT.testStockAdjustmentValidation()` |  PASS |
| 29 | **TC-29** | Rekap laporan penjualan konsisten dengan SUM order selesai | Integration | `OrderAndPaymentIT.testReportService()` |  PASS |
| 30 | **TC-30** | Transisi status pesanan ilegal ditolak State Machine | Unit | `OrderStateMachineTest.testInvalidStatusTransitions()` |  PASS |

---

## 3. Instruksi Menjalankan Pengujian (Testing Guide)

### 3.1 Menjalankan Unit Tests (Surefire)
Dijalankan secara cepat tanpa dependensi eksternal:
```powershell
cd backend
./mvnw test
```

### 3.2 Menjalankan Integration Tests Lengkap (Testcontainers PostgreSQL 18)
Memerlukan Docker engine yang aktif pada sistem host:
```powershell
cd backend
./mvnw verify
```

### 3.3 Menjalankan Skrip Validasi End-to-End (E2E Suite)
Memastikan layanan backend berjalan di port 8080 dan database PostgreSQL aktif:
```powershell
powershell -ExecutionPolicy Bypass -File scratch/test_e2e_full.ps1
```

---

## 4. Hasil & Ringkasan Kelulusan

- **Total Test Cases Didefinisikan:** 30
- **Total Test Cases Lulus:** 30 (100%)
- **Tingkat Kegagalan (Failure Rate):** 0%
- **Regresi Stok / Race Condition:** 0 (Terlindungi oleh Pessimistic Lock & Trigger `trg_apply_stock_movement`)
- **Kebocoran Data / Auth Violation:** 0 (Terlindungi oleh Spring Security RBAC & JWT Claim Verification)
