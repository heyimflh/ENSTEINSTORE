# ENSTEINSTORE — REST API Specification & Contract

Spesifikasi kontrak REST API ENSTEINSTORE untuk komunikasi antara Frontend (Next.js) dan Backend (Spring Boot 4 + PostgreSQL 18).

---

## 1. Konvensi Umum API

- **Base URL:** `/api`
- **Format Pertukaran Data:** JSON (`Content-Type: application/json; charset=UTF-8`), kecuali endpoint multipart upload (`multipart/form-data`).
- **Penamaan Properti:** `camelCase` untuk request dan response body.
- **Tipe Data Nilai Uang:** `number` (representasi dari `BigDecimal` di Java, `NUMERIC(14,2)` di DB). Dilarang mengembalikan string atau floating-point biner tak presisi.
- **Format Tanggal/Waktu:** ISO-8601 string dengan zona waktu UTC / ISO offset (`YYYY-MM-DDTHH:mm:ssZ` / `YYYY-MM-DDTHH:mm:ss+07:00`).
- **Format Standar Pagination:**
  ```json
  {
    "content": [],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5,
    "first": true,
    "last": false
  }
  ```
- **Format Standar Error (K14 / PRD §15.9):**
  ```json
  {
    "timestamp": "2026-11-20T22:30:00Z",
    "status": 400,
    "error": "BAD_REQUEST",
    "code": "VALIDATION_FAILED",
    "message": "Validasi data masukan gagal",
    "path": "/api/orders",
    "fieldErrors": [
      {
        "field": "recipientPhone",
        "message": "Nomor telepon tidak valid"
      }
    ]
  }
  ```
- **Autentikasi:** HTTP Header `Authorization: Bearer <jwt-token>` untuk endpoint yang memerlukan otentikasi.

---

## 2. Ringkasan Endpoint

| Modul | Method | Endpoint | Hak Akses | Deskripsi |
|---|---|---|---|---|
| **Auth** | POST | `/api/auth/register` | Publik | Registrasi customer baru |
| | POST | `/api/auth/login` | Publik | Login pengguna (customer / admin) |
| | POST | `/api/auth/logout` | Terautentikasi | Logout & revoke token (jti) |
| | GET | `/api/auth/me` | Terautentikasi | Data profil pengguna login |
| **Profil** | PUT | `/api/me` | Terautentikasi | Perbarui data diri (nama, telepon, alamat) |
| | PUT | `/api/me/password` | Terautentikasi | Ubah kata sandi |
| **Toko** | GET | `/api/store/config` | Publik | Konfigurasi toko, rekening, biaya kirim, limit |
| **Katalog** | GET | `/api/categories` | Publik | Daftar kategori produk aktif |
| | GET | `/api/units` | Publik | Daftar satuan produk |
| | GET | `/api/products` | Publik | Katalog produk publik (aktif saja, paging & filter) |
| | GET | `/api/products/{idOrCode}` | Publik | Detail produk berdasarkan UUID atau product code |
| **Cart** | GET | `/api/cart` | Customer | Ambil isi keranjang aktif pelanggan |
| | POST | `/api/cart/items` | Customer | Tambah item ke keranjang |
| | PUT | `/api/cart/items/{itemId}` | Customer | Ubah kuantitas item keranjang |
| | DELETE | `/api/cart/items/{itemId}` | Customer | Hapus satu item dari keranjang |
| | DELETE | `/api/cart` | Customer | Kosongkan seluruh keranjang |
| **Order Customer** | POST | `/api/orders` | Customer | Checkout: place order & reservasi stok |
| | GET | `/api/orders/my` | Customer | Riwayat pesanan pelanggan saat ini |
| | GET | `/api/orders/{idOrNumber}` | Customer / Admin | Detail pesanan berdasarkan UUID atau nomor order |
| | POST | `/api/orders/{id}/cancel` | Customer | Batalkan pesanan pending & lepas reservasi |
| **Payment Customer**| GET | `/api/payments/{orderId}` | Customer / Admin | Detail status & instruksi pembayaran |
| | PATCH| `/api/payments/{orderId}/method` | Customer | Ubah metode bayar (saat PENDING/REJECTED) |
| | POST | `/api/payments/{orderId}/submit-proof` | Customer | Upload bukti transfer (multipart/form-data) |
| | POST | `/api/payments/{orderId}/simulate` | Customer | Simulasi pembayaran lunas/gagal (demo mode) |
| **Admin Produk** | GET | `/api/admin/products` | Admin | Daftar seluruh produk (aktif & nonaktif) |
| | POST | `/api/admin/products` | Admin | Buat produk baru |
| | PUT | `/api/admin/products/{id}` | Admin | Perbarui informasi produk |
| | DELETE| `/api/admin/products/{id}` | Admin | Hapus produk (soft delete jika ada riwayat) |
| | POST | `/api/admin/products/{id}/image`| Admin | Upload foto produk (multipart/form-data) |
| **Admin Kategori** | GET | `/api/admin/categories` | Admin | Daftar seluruh kategori |
| | POST | `/api/admin/categories` | Admin | Buat kategori baru |
| | PUT | `/api/admin/categories/{id}` | Admin | Perbarui data kategori / toggle aktif |
| **Admin Satuan** | GET | `/api/admin/units` | Admin | Daftar satuan |
| | POST | `/api/admin/units` | Admin | Tambah satuan baru |
| | PUT | `/api/admin/units/{id}` | Admin | Ubah satuan |
| **Admin Pesanan** | GET | `/api/admin/orders` | Admin | Pencarian & filter seluruh pesanan |
| | PATCH| `/api/admin/orders/{id}/status` | Admin | Transisi status pesanan (OrderStateMachine) |
| | POST | `/api/admin/orders/{id}/cancel` | Admin | Batalkan pesanan (hanya PENDING_PAYMENT) |
| **Admin Pembayaran**| GET | `/api/admin/payments` | Admin | Daftar pembayaran & bukti transfer |
| | GET | `/api/admin/payments/{id}` | Admin | Detail pembayaran spesifik |
| | POST | `/api/admin/payments/{id}/verify` | Admin | Verifikasi transfer (setujui / tolak) / konfirmasi tunai |
| **Admin Inventory** | GET | `/api/admin/inventory` | Admin | Status stok seluruh produk (Normal/Low/Out) |
| | POST | `/api/admin/inventory/stock-in` | Admin | Catat barang masuk (memanggil SP DB) |
| | POST | `/api/admin/inventory/adjustment` | Admin | Koreksi stok fisik dengan alasan wajib |
| | GET | `/api/admin/inventory/movements` | Admin | Riwayat audit stock movement (7 tipe) |
| **Admin Offline** | POST | `/api/admin/offline-sales` | Admin | Catat transaksi penjualan toko langsung |
| **Dashboard** | GET | `/api/admin/dashboard/summary` | Admin | Ringkasan dashboard (paralel CompletableFuture) |
| **Laporan** | GET | `/api/admin/reports/sales` | Admin | Laporan agregasi penjualan harian/bulanan |
| | GET | `/api/admin/reports/products` | Admin | Laporan performa & ranking penjualan produk |
| | GET | `/api/admin/reports/inventory` | Admin | Laporan mutasi stok dan persediaan |
| | GET | `/api/admin/reports/transactions` | Admin | Laporan rekap seluruh transaksi |
| | GET | `/api/admin/reports/export` | Admin | Ekspor laporan ke file CSV (Java File I/O) |

---

## 3. Spesifikasi Rinci Request & Response Payload

### 3.1 Authentication & Profile

#### `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "fullName": "Bu Rina Konveksi",
    "email": "rina@example.com",
    "password": "Password123!",
    "phone": "081234567890",
    "defaultAddress": "Jl. Kertanegara No. 12, Kebumen"
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "fullName": "Bu Rina Konveksi",
    "email": "rina@example.com",
    "phone": "081234567890",
    "defaultAddress": "Jl. Kertanegara No. 12, Kebumen",
    "role": "CUSTOMER"
  }
  ```

#### `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "rina@example.com",
    "password": "Password123!"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 28800,
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "fullName": "Bu Rina Konveksi",
      "email": "rina@example.com",
      "phone": "081234567890",
      "defaultAddress": "Jl. Kertanegara No. 12, Kebumen",
      "role": "CUSTOMER"
    }
  }
  ```
- **Response 401 Unauthorized:** Pesan generik `"Email atau password salah."`

#### `GET /api/auth/me`
- **Response 200 OK:** Membawa data user profil + role + `adminCode` (khusus role ADMIN).

---

### 3.2 Store Configuration

#### `GET /api/store/config`
- **Response 200 OK:**
  ```json
  {
    "storeName": "ENSTEINSTORE",
    "owner": "Toko Enstein",
    "phone": "+62 838 7694 2484",
    "deliveryFee": 15000,
    "paymentExpiryHours": 24,
    "simulationEnabled": true,
    "maxUploadBytes": 2097152,
    "bankAccounts": [
      {
        "bankName": "BCA (Bank Central Asia)",
        "bankCode": "BCA",
        "accountNumber": "883019283391",
        "accountHolder": "TOKO ENSTEIN KEBUMEN"
      },
      {
        "bankName": "Bank Mandiri",
        "bankCode": "MANDIRI",
        "accountNumber": "1370029381029",
        "accountHolder": "TOKO ENSTEIN KEBUMEN"
      },
      {
        "bankName": "BRI (Bank Rakyat Indonesia)",
        "bankCode": "BRI",
        "accountNumber": "012301002938501",
        "accountHolder": "TOKO ENSTEIN KEBUMEN"
      }
    ],
    "ewallets": [
      {
        "provider": "QRIS & E-Wallet Nasional",
        "accountNumber": "0812-3456-7890",
        "accountHolder": "TOKO ENSTEIN STORE",
        "nmid": "ID1020039281920"
      }
    ]
  }
  ```

---

### 3.3 Product Catalog

#### `GET /api/products`
- **Query Params:** `search`, `category`, `sort` (`terbaru` | `harga-rendah` | `harga-tinggi` | `terpopuler`), `isFeatured`, `isNew`, `page`, `size`.
- **Response 200 OK:** Page data of `ProductResponseDTO`:
  ```json
  {
    "content": [
      {
        "id": "e91c7a23-4567-4890-a123-456789abcdef",
        "code": "PRD-BHN-001",
        "name": "PVC Super Ketebalan 0.25",
        "categoryId": "c1234567-89ab-cdef-0123-456789abcdef",
        "categoryName": "Material Jas Hujan",
        "price": 35000,
        "unit": "meter",
        "unitName": "Meter",
        "unitSymbol": "m",
        "allowDecimal": true,
        "stockOnHand": 150.000,
        "reservedQuantity": 0.000,
        "availableStock": 150.000,
        "minimumStock": 20.000,
        "stockStatus": "NORMAL",
        "description": "Kain PVC super tebal 0.25mm lentur waterproof premium...",
        "imageUrl": "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg",
        "isActive": true,
        "isFeatured": true,
        "isNew": false,
        "salesCount": 420,
        "createdAt": "2026-03-01T08:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 11,
    "totalPages": 1
  }
  ```

---

### 3.4 Shopping Cart

#### `GET /api/cart`
- **Response 200 OK:**
  ```json
  {
    "id": "cart-uuid",
    "items": [
      {
        "id": "item-uuid",
        "productId": "prod-uuid",
        "productCode": "PRD-BHN-001",
        "productName": "PVC Super Ketebalan 0.25",
        "imageUrl": "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg",
        "unit": "meter",
        "allowDecimal": true,
        "unitPrice": 35000,
        "quantity": 2.500,
        "subtotal": 87500,
        "availableStock": 150.000,
        "stockWarning": null
      }
    ],
    "subtotal": 87500,
    "total": 87500,
    "hasStockIssue": false
  }
  ```

---

### 3.5 Checkout & Orders

#### `POST /api/orders`
- **Request Body:**
  ```json
  {
    "recipientName": "Bu Rina",
    "recipientPhone": "081298765432",
    "fulfillmentMethod": "DELIVERY",
    "deliveryAddress": "Jl. Rancabolang No. 14, Buahbatu, Bandung, 40286",
    "notes": "Paking rapi jangan dilipat terlalu tajam.",
    "paymentMethod": "BANK_TRANSFER"
  }
  ```
- **Response 201 Created:** `OrderResponseDTO`
  ```json
  {
    "id": "order-uuid",
    "orderNumber": "EST-20261120-0001",
    "salesChannel": "ONLINE",
    "orderStatus": "PENDING_PAYMENT",
    "paymentStatus": "PENDING",
    "paymentMethod": "BANK_TRANSFER",
    "fulfillmentMethod": "DELIVERY",
    "deliveryAddress": "Jl. Rancabolang No. 14, Buahbatu, Bandung, 40286",
    "recipientName": "Bu Rina",
    "recipientPhone": "081298765432",
    "notes": "Paking rapi jangan dilipat terlalu tajam.",
    "subtotal": 87500,
    "deliveryFee": 15000,
    "totalAmount": 102500,
    "paymentDeadline": "2026-11-21T22:30:00Z",
    "orderDate": "2026-11-20T22:30:00Z",
    "cancellationReason": null,
    "items": [
      {
        "id": "order-item-uuid",
        "productId": "prod-uuid",
        "productCode": "PRD-BHN-001",
        "productName": "PVC Super Ketebalan 0.25",
        "unitName": "Meter",
        "quantity": 2.500,
        "unitPrice": 35000,
        "subtotal": 87500,
        "imageUrl": "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg"
      }
    ],
    "timeline": [
      {
        "status": "PENDING_PAYMENT",
        "at": "2026-11-20T22:30:00Z"
      }
    ]
  }
  ```

---

### 3.6 Payments

#### `POST /api/payments/{orderId}/simulate`
- **Request Body:**
  ```json
  {
    "outcome": "SUCCESS"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "orderId": "order-uuid",
    "paymentStatus": "PAID",
    "orderStatus": "PAID",
    "outcome": "SUCCESS",
    "message": "Simulasi pembayaran berhasil lunas."
  }
  ```

#### `POST /api/admin/payments/{id}/verify`
- **Request Body:**
  ```json
  {
    "approve": true,
    "rejectionReason": null
  }
  ```
- **Response 200 OK:** Menghasilkan status pembayaran `PAID` (jika approve) atau `REJECTED` (jika reject) beserta mutasi stok `ONLINE_SALE_OUT`.

---

### 3.7 Offline Sales

#### `POST /api/admin/offline-sales`
- **Request Body:**
  ```json
  {
    "customerName": "Pak Joko (Walk-in)",
    "customerPhone": "08134567890",
    "paymentMethod": "CASH",
    "cashReceived": 200000,
    "notes": "Penjualan langsung toko",
    "items": [
      {
        "productId": "prod-uuid",
        "quantity": 5.000
      }
    ]
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "order": { ...OrderResponseDTO... },
    "cashReceived": 200000,
    "change": 25000
  }
  ```

---

### 3.8 Dashboard & Reports

#### `GET /api/admin/dashboard/summary?period=today|7d|30d|month|custom&from=&to=`
- **Response 200 OK:**
  ```json
  {
    "cards": {
      "totalSales": 48750000,
      "totalOrders": 184,
      "totalProducts": 11,
      "lowStockCount": 2
    },
    "salesChart": [
      {
        "date": "2026-11-14",
        "label": "Jum",
        "total": 7400000,
        "online": 4900000,
        "offline": 2500000,
        "orders": 29
      }
    ],
    "recentOrders": [],
    "lowStock": [],
    "bestSellers": []
  }
  ```

#### `GET /api/admin/reports/export?type=sales|products|inventory|transactions&from=&to=`
- **Response 200 OK:** Stream `text/csv; charset=UTF-8`, header `Content-Disposition: attachment; filename="report-sales-20261120.csv"`. Proteksi CSV injection aktif (sel diawali `=`, `+`, `-`, `@` diberi prefix `'`).
