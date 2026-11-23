-- ============================================================
-- V7: Create Stock Movements Table
-- PRD §13.4.12 + §12.2 — Inventory Domain
-- RULE: This is the ONLY way to mutate stock (see AGENTS.md Rule 7)
-- K1: 7 movement types from PRD §12.2
-- PRD §12.4.6: audit columns (stock_before, stock_after, reserved_before, reserved_after)
-- ============================================================

CREATE TABLE stock_movements (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID            NOT NULL REFERENCES products(id),
    movement_type       VARCHAR(20)     NOT NULL CHECK (movement_type IN (
                                            'STOCK_IN',
                                            'SALE',
                                            'RETURN',
                                            'ADJUSTMENT',
                                            'RESERVE',
                                            'UNRESERVE',
                                            'FULFILLMENT'
                                        )),
    quantity            NUMERIC(12,3)   NOT NULL CHECK (quantity > 0),
    stock_before        NUMERIC(12,3)   NOT NULL,
    stock_after         NUMERIC(12,3)   NOT NULL,
    reserved_before     NUMERIC(12,3)   NOT NULL,
    reserved_after      NUMERIC(12,3)   NOT NULL,
    reference_id        UUID,           -- order_id or null for manual adjustments
    reference_type      VARCHAR(20),    -- 'ORDER', 'ADJUSTMENT', 'RETURN'
    notes               TEXT,
    created_by_id       UUID            REFERENCES users(id),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    -- No updated_at: stock_movements is append-only (PRD §12.4.6, immutable audit log)
);

-- Guard: prevent any UPDATE or DELETE on stock_movements (append-only)
-- Implemented in V11 (triggers)

CREATE INDEX idx_stock_movements_product   ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_id);
CREATE INDEX idx_stock_movements_type      ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created   ON stock_movements(created_at DESC);
