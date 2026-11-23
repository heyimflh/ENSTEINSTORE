-- ============================================================
-- V14: Fix Admin Seed Password Hash
-- The BCrypt hash in V13 for 'EnsteinAdmin2026!' was incorrect.
-- This migration replaces it with a verified BCrypt(cost=10) hash.
-- Hash verified with BCryptPasswordEncoder(10).matches() = true
-- ============================================================
UPDATE users
SET password_hash = '$2a$10$N31NTmtOgkA3I0rUiHApJefC.t110kDuAtmdKvT7hh4.y8.I1Y9Jq',
    updated_at    = NOW()
WHERE email = 'admin@ensteinstore.com'
  AND role  = 'ADMIN';
