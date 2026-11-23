# ENSTEINSTORE — Entity Relationship Diagram (ERD)

Mermaid diagram di bawah memodelkan seluruh relasi tabel dalam skema basis data PostgreSQL 18 untuk Toko Enstein, mematuhi prinsip 3-Tier Architecture, 3NF, dan batasan PRD §13.

```mermaid
erDiagram
    USERS ||--o| CUSTOMERS : "extends (1:0..1)"
    USERS ||--o| ADMINS : "extends (1:0..1)"
    USERS ||--o{ STOCK_MOVEMENTS : "audits / created_by"
    ADMINS ||--o{ ORDERS : "creates offline (0..1:N)"
    ADMINS ||--o{ PAYMENTS : "verifies (0..1:N)"

    CUSTOMERS ||--o{ CARTS : "owns"
    CUSTOMERS ||--o{ ORDERS : "places"

    CATEGORIES ||--o{ PRODUCTS : "classifies"
    UNITS ||--o{ PRODUCTS : "quantifies"

    CARTS ||--o{ CART_ITEMS : "contains"
    PRODUCTS ||--o{ CART_ITEMS : "referenced_in"

    ORDERS ||--o{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered_in"

    ORDERS ||--|| PAYMENTS : "paid_via (1:1 BR-05)"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "mutated_via"

    ORDER_NUMBER_COUNTERS {
        date order_date PK
        int last_value
    }

    REVOKED_TOKENS {
        varchar jti PK
        timestamptz expires_at
    }

    USERS {
        uuid id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        varchar phone
        varchar role "CUSTOMER | ADMIN"
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    CUSTOMERS {
        uuid id PK,FK "references users(id)"
        text address
        varchar city
        timestamptz created_at
    }

    ADMINS {
        uuid id PK,FK "references users(id)"
        timestamptz created_at
    }

    CATEGORIES {
        uuid id PK
        varchar name UK
        varchar slug UK
        text description
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    UNITS {
        uuid id PK
        varchar unit_name UK
        varchar unit_symbol UK
        boolean allow_decimal
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCTS {
        uuid id PK
        varchar product_code UK
        varchar name
        text description
        uuid category_id FK
        uuid unit_id FK
        numeric price "NUMERIC(14,2)"
        numeric stock_on_hand "NUMERIC(12,3)"
        numeric reserved_quantity "NUMERIC(12,3)"
        numeric minimum_stock "NUMERIC(12,3)"
        varchar image_url
        boolean is_active
        boolean is_featured
        timestamptz created_at
        timestamptz updated_at
    }

    CARTS {
        uuid id PK
        uuid customer_id FK
        varchar status "ACTIVE | CHECKED_OUT | ABANDONED"
        timestamptz created_at
        timestamptz updated_at
    }

    CART_ITEMS {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        numeric quantity "NUMERIC(12,3)"
        numeric price_at_add "NUMERIC(14,2)"
        timestamptz created_at
        timestamptz updated_at
    }

    ORDERS {
        uuid id PK
        varchar order_number UK "EST-YYYYMMDD-XXXX"
        uuid customer_id FK "nullable for offline"
        uuid created_by_admin_id FK "nullable for online"
        varchar order_type "ONLINE | OFFLINE"
        varchar order_status
        varchar payment_status
        varchar fulfillment_method "DELIVERY | PICKUP | IN_STORE"
        varchar recipient_name
        varchar recipient_phone
        text delivery_address
        text notes
        numeric subtotal "NUMERIC(14,2)"
        numeric delivery_fee "NUMERIC(14,2)"
        numeric total_amount "NUMERIC(14,2)"
        varchar payment_method
        timestamptz payment_deadline
        timestamptz order_date
        text cancellation_reason
        timestamptz cancelled_at
        timestamptz created_at
        timestamptz updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        varchar product_code
        varchar product_name
        varchar unit_symbol
        numeric quantity "NUMERIC(12,3)"
        numeric unit_price "NUMERIC(14,2)"
        numeric subtotal "NUMERIC(14,2)"
        timestamptz created_at
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK,UK "1:1 with orders (BR-05)"
        varchar payment_method
        varchar status "PENDING..EXPIRED"
        numeric amount "NUMERIC(14,2)"
        varchar proof_of_payment_url
        timestamptz submitted_at
        timestamptz verified_at
        uuid verified_by_admin_id FK
        text rejection_reason
        varchar simulation_outcome
        timestamptz created_at
        timestamptz updated_at
    }

    STOCK_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        varchar movement_type "7 types PRD §12.2"
        numeric quantity "NUMERIC(12,3)"
        numeric stock_before "NUMERIC(12,3)"
        numeric stock_after "NUMERIC(12,3)"
        numeric reserved_before "NUMERIC(12,3)"
        numeric reserved_after "NUMERIC(12,3)"
        uuid reference_id
        varchar reference_type
        text notes
        uuid created_by_id FK
        timestamptz created_at
    }
```

## Relasi dan Aturan Integritas
1. **Inheritance Pengguna (Table-per-Type):** `users` adalah tabel dasar, sedangkan `customers` dan `admins` berbagi PK yang sama sebagai FK (`ON DELETE CASCADE`).
2. **Koleksi Keranjang Tunggal Aktif:** Terdapat Partial Unique Index pada `carts(customer_id) WHERE status = 'ACTIVE'`.
3. **Pencegahan Item Duplikat:** Unique index `(cart_id, product_id)` dan `(order_id, product_id)`.
4. **Relasi 1:1 Pembayaran:** `payments.order_id` bersifat `UNIQUE` (BR-05).
5. **Audit Trail Mutasi Stok (Immutable):** `stock_movements` bersifat *append-only*. Trigger menolak instruksi `UPDATE` atau `DELETE`.
