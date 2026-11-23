-- ============================================================
-- V3: Create Products Table
-- PRD §13.4.6 — Catalog Domain
-- K8: is_featured, salesCount derived, isNew derived from created_at
-- K9: product_code for lookup
-- ============================================================

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

    -- Business constraints
    CONSTRAINT chk_reserved_lte_stock
        CHECK (reserved_quantity <= stock_on_hand)
);

CREATE INDEX idx_products_code        ON products(product_code);
CREATE INDEX idx_products_category    ON products(category_id);
CREATE INDEX idx_products_unit        ON products(unit_id);
CREATE INDEX idx_products_is_active   ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_name        ON products USING GIN (to_tsvector('indonesian', name));
CREATE INDEX idx_products_created_at  ON products(created_at DESC);

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
