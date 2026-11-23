-- ============================================================
-- V2: Create Categories and Units Tables
-- PRD §13.4 — Catalog Domain
-- ============================================================

-- ============================================================
-- TABLE: categories (PRD §13.4.4)
-- ============================================================
CREATE TABLE categories (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)    NOT NULL UNIQUE,
    slug        VARCHAR(120)    NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- TABLE: units (PRD §13.4.5 + K10)
-- unit_symbol: lower case symbol for API compatibility (K10)
-- allow_decimal: true for meter (fractional quantities allowed)
-- ============================================================
CREATE TABLE units (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name       VARCHAR(50)     NOT NULL UNIQUE,
    unit_symbol     VARCHAR(20)     NOT NULL UNIQUE,
    allow_decimal   BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_units_updated_at
    BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
