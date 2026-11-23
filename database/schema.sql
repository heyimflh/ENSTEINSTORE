-- ============================================================
-- ENSTEINSTORE — Full Relational Schema Snapshot (PostgreSQL 18)
-- Generated from Flyway migrations V1 through V12
-- Single Source of Truth remains V1-V13 Flyway files
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS DOMAIN
CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20)     NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
    id              UUID            PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    address         TEXT,
    city            VARCHAR(100),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE admins (
    id              UUID            PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE revoked_tokens (
    jti         VARCHAR(36)     PRIMARY KEY,
    expires_at  TIMESTAMPTZ     NOT NULL
);

-- 2. CATALOG DOMAIN
CREATE TABLE categories (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)    NOT NULL UNIQUE,
    slug        VARCHAR(120)    NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE units (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name       VARCHAR(50)     NOT NULL UNIQUE,
    unit_symbol     VARCHAR(20)     NOT NULL UNIQUE,
    allow_decimal   BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code        VARCHAR(30)     NOT NULL UNIQUE,
    name                VARCHAR(200)    NOT NULL,
    description         TEXT,
    category_id         UUID            NOT NULL REFERENCES categories(id),
    unit_id             UUID            NOT NULL REFERENCES units(id),
    price               NUMERIC(14,2)   NOT NULL CHECK (price >= 0),
    stock_on_hand       NUMERIC(12,3)   NOT NULL DEFAULT 0 CHECK (stock_on_hand >= 0),
    reserved_quantity   NUMERIC(12,3)   NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    minimum_stock       NUMERIC(12,3)   NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    image_url           VARCHAR(500),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reserved_lte_stock CHECK (reserved_quantity <= stock_on_hand)
);

-- 3. SHOPPING CART DOMAIN
CREATE TABLE carts (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID            NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CHECKED_OUT', 'ABANDONED')),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_carts_one_active_per_customer ON carts(customer_id) WHERE status = 'ACTIVE';

CREATE TABLE cart_items (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id     UUID            NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id  UUID            NOT NULL REFERENCES products(id),
    quantity    NUMERIC(12,3)   NOT NULL CHECK (quantity > 0),
    price_at_add NUMERIC(14,2)  NOT NULL CHECK (price_at_add >= 0),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cart_items_cart_product UNIQUE (cart_id, product_id)
);

-- 4. ORDER DOMAIN
CREATE TABLE order_number_counters (
    order_date  DATE    PRIMARY KEY,
    last_value  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number            VARCHAR(25)     NOT NULL UNIQUE,
    customer_id             UUID            REFERENCES customers(id),
    created_by_admin_id     UUID            REFERENCES admins(id),
    order_type              VARCHAR(10)     NOT NULL CHECK (order_type IN ('ONLINE', 'OFFLINE')),
    order_status            VARCHAR(20)     NOT NULL DEFAULT 'PENDING_PAYMENT'
                                            CHECK (order_status IN ('PENDING_PAYMENT', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED', 'CANCELLED')),
    payment_status          VARCHAR(25)     NOT NULL DEFAULT 'PENDING'
                                            CHECK (payment_status IN ('PENDING', 'WAITING_VERIFICATION', 'PAID', 'REJECTED', 'EXPIRED')),
    fulfillment_method      VARCHAR(10)     NOT NULL CHECK (fulfillment_method IN ('DELIVERY', 'PICKUP', 'IN_STORE')),
    recipient_name          VARCHAR(100),
    recipient_phone         VARCHAR(20),
    delivery_address        TEXT,
    notes                   TEXT,
    subtotal                NUMERIC(14,2)   NOT NULL CHECK (subtotal >= 0),
    delivery_fee            NUMERIC(14,2)   NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    total_amount            NUMERIC(14,2)   NOT NULL CHECK (total_amount >= 0),
    payment_method          VARCHAR(20)     CHECK (payment_method IN ('BANK_TRANSFER', 'E_WALLET', 'SIMULATED', 'CASH')),
    payment_deadline        TIMESTAMPTZ,
    order_date              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    cancellation_reason     TEXT,
    cancelled_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_delivery_needs_address CHECK (fulfillment_method <> 'DELIVERY' OR delivery_address IS NOT NULL),
    CONSTRAINT chk_offline_needs_admin CHECK (order_type <> 'OFFLINE' OR (created_by_admin_id IS NOT NULL AND fulfillment_method = 'IN_STORE')),
    CONSTRAINT chk_total_equals_subtotal_plus_fee CHECK (total_amount = subtotal + delivery_fee),
    CONSTRAINT chk_order_has_actor CHECK (customer_id IS NOT NULL OR created_by_admin_id IS NOT NULL)
);

CREATE TABLE order_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products(id),
    product_code    VARCHAR(30)     NOT NULL,
    product_name    VARCHAR(200)    NOT NULL,
    unit_symbol     VARCHAR(20)     NOT NULL,
    quantity        NUMERIC(12,3)   NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(14,2)   NOT NULL CHECK (unit_price >= 0),
    subtotal        NUMERIC(14,2)   NOT NULL CHECK (subtotal >= 0),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_order_items_order_product UNIQUE (order_id, product_id)
);

-- 5. PAYMENT DOMAIN
CREATE TABLE payments (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID            NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    payment_method          VARCHAR(20)     NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'E_WALLET', 'SIMULATED', 'CASH')),
    status                  VARCHAR(25)     NOT NULL DEFAULT 'PENDING'
                                            CHECK (status IN ('PENDING', 'WAITING_VERIFICATION', 'PAID', 'REJECTED', 'EXPIRED')),
    amount                  NUMERIC(14,2)   NOT NULL CHECK (amount >= 0),
    proof_of_payment_url    VARCHAR(500),
    submitted_at            TIMESTAMPTZ,
    verified_at             TIMESTAMPTZ,
    verified_by_admin_id    UUID            REFERENCES admins(id),
    rejection_reason        TEXT,
    simulation_outcome      VARCHAR(10)     CHECK (simulation_outcome IN ('SUCCESS', 'FAILED')),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 6. INVENTORY DOMAIN (SINGLE CHOKE POINT & AUDIT TRAIL)
CREATE TABLE stock_movements (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID            NOT NULL REFERENCES products(id),
    movement_type       VARCHAR(20)     NOT NULL CHECK (movement_type IN (
                                            'STOCK_IN', 'SALE', 'RETURN', 'ADJUSTMENT',
                                            'RESERVE', 'UNRESERVE', 'FULFILLMENT'
                                        )),
    quantity            NUMERIC(12,3)   NOT NULL CHECK (quantity > 0),
    stock_before        NUMERIC(12,3)   NOT NULL,
    stock_after         NUMERIC(12,3)   NOT NULL,
    reserved_before     NUMERIC(12,3)   NOT NULL,
    reserved_after      NUMERIC(12,3)   NOT NULL,
    reference_id        UUID,
    reference_type      VARCHAR(20),
    notes               TEXT,
    created_by_id       UUID            REFERENCES users(id),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
