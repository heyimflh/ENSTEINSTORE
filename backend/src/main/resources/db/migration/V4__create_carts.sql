-- ============================================================
-- V4: Create Carts and Cart Items Tables
-- PRD §13.4.7-8 — Shopping Cart Domain
-- ============================================================

-- ============================================================
-- TABLE: carts
-- Only one ACTIVE cart per customer (partial unique index)
-- ============================================================
CREATE TABLE carts (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID            NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE', 'CHECKED_OUT', 'ABANDONED')),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Only one ACTIVE cart per customer
CREATE UNIQUE INDEX idx_carts_one_active_per_customer
    ON carts(customer_id)
    WHERE status = 'ACTIVE';

CREATE INDEX idx_carts_customer ON carts(customer_id);
CREATE INDEX idx_carts_status   ON carts(status);

CREATE TRIGGER trg_carts_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- TABLE: cart_items
-- UNIQUE(cart_id, product_id) prevents duplicate items
-- quantity > 0 enforced
-- ============================================================
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

CREATE INDEX idx_cart_items_cart    ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

CREATE TRIGGER trg_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
