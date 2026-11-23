-- ============================================================
-- V5: Create Orders, Order Items, and Order Number Counter Tables
-- PRD §13.4.9-11 — Order Domain
-- K5: delivery_address, notes fields
-- K6: payment_deadline column
-- K9: order_number format EST-YYYYMMDD-XXXX
-- ============================================================

-- ============================================================
-- TABLE: order_number_counters
-- Atomic order number generation (K9, anti-race condition)
-- Uses INSERT ... ON CONFLICT DO UPDATE ... RETURNING
-- ============================================================
CREATE TABLE order_number_counters (
    order_date  DATE    PRIMARY KEY,
    last_value  INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- TABLE: orders (PRD §13.4.9)
-- K5: notes field added
-- K6: payment_deadline, cancellation columns added
-- ============================================================
CREATE TABLE orders (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number            VARCHAR(25)     NOT NULL UNIQUE,
    customer_id             UUID            REFERENCES customers(id),
    created_by_admin_id     UUID            REFERENCES admins(id),
    order_type              VARCHAR(10)     NOT NULL CHECK (order_type IN ('ONLINE', 'OFFLINE')),
    order_status            VARCHAR(20)     NOT NULL DEFAULT 'PENDING_PAYMENT'
                                            CHECK (order_status IN (
                                                'PENDING_PAYMENT',
                                                'PROCESSING',
                                                'READY_FOR_PICKUP',
                                                'SHIPPED',
                                                'COMPLETED',
                                                'CANCELLED'
                                            )),
    payment_status          VARCHAR(25)     NOT NULL DEFAULT 'PENDING'
                                            CHECK (payment_status IN (
                                                'PENDING',
                                                'WAITING_VERIFICATION',
                                                'PAID',
                                                'REJECTED',
                                                'EXPIRED'
                                            )),
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

    -- Business constraints
    -- DELIVERY orders must have delivery_address
    CONSTRAINT chk_delivery_needs_address
        CHECK (fulfillment_method <> 'DELIVERY' OR delivery_address IS NOT NULL),

    -- OFFLINE orders must have admin creator and IN_STORE fulfillment
    CONSTRAINT chk_offline_needs_admin
        CHECK (order_type <> 'OFFLINE' OR (created_by_admin_id IS NOT NULL AND fulfillment_method = 'IN_STORE')),

    -- Total = subtotal + delivery_fee
    CONSTRAINT chk_total_equals_subtotal_plus_fee
        CHECK (total_amount = subtotal + delivery_fee),

    -- Customer or admin must exist for the order
    CONSTRAINT chk_order_has_actor
        CHECK (customer_id IS NOT NULL OR created_by_admin_id IS NOT NULL)
);

CREATE INDEX idx_orders_customer        ON orders(customer_id);
CREATE INDEX idx_orders_admin           ON orders(created_by_admin_id);
CREATE INDEX idx_orders_order_number    ON orders(order_number);
CREATE INDEX idx_orders_order_date      ON orders(order_date DESC);
CREATE INDEX idx_orders_order_status    ON orders(order_status);
CREATE INDEX idx_orders_payment_status  ON orders(payment_status);
CREATE INDEX idx_orders_order_type      ON orders(order_type);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- TABLE: order_items (PRD §13.4.10)
-- UNIQUE(order_id, product_id) — no duplicate products per order
-- ============================================================
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

CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
