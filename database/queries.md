# ENSTEINSTORE — Kueri Basis Data Penting & Logika Operasional

Dokumen ini mendokumentasikan kueri-kueri utama PostgreSQL 18 yang digunakan oleh backend ENSTEINSTORE untuk operasi inti, anti-race condition, dan pelaporan analitik.

---

## 1. Anti-Race Condition: Nomor Pesanan Atomik
```sql
-- Dijalankan dalam satu operasi atomik (K9, PRD §13.7)
-- Mengeliminasi race condition tanpa tabel lock manual
INSERT INTO order_number_counters (order_date, last_value)
VALUES (CURRENT_DATE AT TIME ZONE 'Asia/Jakarta', 1)
ON CONFLICT (order_date)
DO UPDATE SET last_value = order_number_counters.last_value + 1
RETURNING last_value;
```

---

## 2. Anti-Race Condition: Penguncian Stok Saat Checkout
```sql
-- Kunci baris produk secara terurut berdasarkan ID untuk mencegah deadlock
-- Sesuai AGENTS.md §4 & PRD §12
SELECT id, product_code, name, price, stock_on_hand, reserved_quantity
FROM products
WHERE id IN (:productIdsOrdered)
ORDER BY id ASC
FOR UPDATE;
```

---

## 3. Mutasi Stok Tunggal (Single Choke Point)
```sql
-- Aturan Mutlak (AGENTS.md Rule 7):
-- Backend Java TIDAK PERNAH meng-UPDATE stock_on_hand secara langsung.
-- Mutasi hanya melalui INSERT ke stock_movements:
INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity,
    stock_before,
    stock_after,
    reserved_before,
    reserved_after,
    reference_id,
    reference_type,
    notes,
    created_by_id
) VALUES (
    :productId,
    'RESERVE', -- atau FULFILLMENT, UNRESERVE, STOCK_IN, SALE, RETURN, ADJUSTMENT
    :qty,
    :stockBefore,
    :stockAfter,
    :reservedBefore,
    :reservedAfter,
    :orderId,
    'ORDER',
    'Order checkout reservation',
    :userId
);
-- Trigger fn_apply_stock_movement() otomatis memperbarui kolom stock_on_hand & reserved_quantity di tabel products.
```

---

## 4. Kueri Laporan Penjualan (View v_sales_report)
```sql
-- Digunakan oleh DashboardService dan ReportService (PRD §18.2)
-- Kriteria "Terjual" (K13): payment_status='PAID' DAN order_status<>'CANCELLED'
SELECT
    sale_date,
    total_orders,
    total_revenue,
    total_subtotal,
    total_delivery_fee,
    unique_customers
FROM v_sales_report
WHERE sale_date BETWEEN :startDate AND :endDate
ORDER BY sale_date DESC;
```

---

## 5. Kueri Status Stok Menipis (View v_stock_status)
```sql
-- Digunakan oleh InventoryService untuk alert stok menipis (PRD §12.3)
SELECT
    product_id,
    product_code,
    product_name,
    category_name,
    unit_symbol,
    stock_on_hand,
    reserved_quantity,
    available_quantity,
    minimum_stock
FROM v_stock_status
WHERE is_low_stock = TRUE AND is_active = TRUE
ORDER BY available_quantity ASC;
```

---

## 6. Kueri Idempotency Guard Pembayaran
```sql
-- Mengunci baris pembayaran untuk verifikasi admin atau simulasi (PRD §11.2)
SELECT p.id, p.status, p.amount, o.order_status
FROM payments p
INNER JOIN orders o ON o.id = p.order_id
WHERE p.order_id = :orderId
FOR UPDATE;
```
