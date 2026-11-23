-- ============================================================
-- V1: Create Users, Customers, Admins, Revoked Tokens Tables
-- PRD §13.4 — User Domain
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: users (abstract base, PRD §13.4.1)
-- ============================================================
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- TABLE: customers (extends users, PRD §13.4.2)
-- ============================================================
CREATE TABLE customers (
    id              UUID            PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    address         TEXT,
    city            VARCHAR(100),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: admins (extends users, PRD §13.4.3)
-- ============================================================
CREATE TABLE admins (
    id              UUID            PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: revoked_tokens — JWT blacklist (K12)
-- Cleaned up by scheduler when expires_at < NOW()
-- ============================================================
CREATE TABLE revoked_tokens (
    jti         VARCHAR(36)     PRIMARY KEY,
    expires_at  TIMESTAMPTZ     NOT NULL
);

CREATE INDEX idx_revoked_tokens_expires ON revoked_tokens(expires_at);

-- ============================================================
-- TRIGGER: auto-update updated_at on users
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
