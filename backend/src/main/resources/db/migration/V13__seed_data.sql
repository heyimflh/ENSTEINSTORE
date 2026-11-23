-- ============================================================
-- V13: Seed Data
-- Initial data for ENSTEINSTORE
-- - 5 categories (from frontend mock-data.ts)
-- - 3 units (K10: Meter, Pcs, Roll)
-- - 11 products (from frontend/src/data/products.ts PRODUCTS array)
-- - 1 admin user (password from env or default dev password)
-- ============================================================
-- NOTE: Image paths use CORRECT case-sensitive filenames (K11 bug fix):
--   KancingALL.jpeg  (not KancingAll.jpeg)
--   ElastikALL.jpeg  (not ElastikAll.jpeg)
--   LobiLobiALL.jpg  (not LobilobiAll.jpg)
-- ============================================================

-- ============================================================
-- UNITS (K10)
-- unit_symbol lowercase for API compatibility
-- ============================================================
INSERT INTO units (id, unit_name, unit_symbol, allow_decimal) VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'Meter',  'm',    TRUE),
    ('a1b2c3d4-0001-0001-0001-000000000002', 'Pcs',    'pcs',  FALSE),
    ('a1b2c3d4-0001-0001-0001-000000000003', 'Roll',   'roll', FALSE)
ON CONFLICT (unit_name) DO NOTHING;

-- ============================================================
-- CATEGORIES (from frontend/src/data/mock-data.ts MOCK_CATEGORIES)
-- ============================================================
INSERT INTO categories (id, name, slug, description) VALUES
    ('b2c3d4e5-0002-0002-0002-000000000001', 'Material Jas Hujan', 'material-jas-hujan',
     'Kain PVC balon elastis, waterproof super tebal, dan material jas hujan berkualitas.'),
    ('b2c3d4e5-0002-0002-0002-000000000002', 'Resleting',          'resleting',
     'Resleting waterproof zipper, tarikan halus, dan kedap air.'),
    ('b2c3d4e5-0002-0002-0002-000000000003', 'Kancing',            'kancing',
     'Kancing jepret snap button tahan karat dan kuat dicuci.'),
    ('b2c3d4e5-0002-0002-0002-000000000004', 'Karet',              'karet',
     'Karet elastis tenun untuk ban pinggang dan manset pergelangan.'),
    ('b2c3d4e5-0002-0002-0002-000000000005', 'Aksesori',           'aksesori',
     'Seam sealing tape hot melt, tali kur hoodie, stopper lobi-lobi, dan skotlet reflektor.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRODUCTS (from frontend/src/data/products.ts PRODUCTS array)
-- Fixed image path case-sensitivity for Linux (K11)
-- Stock seeded via direct INSERT then initial stock_movements
-- ============================================================

-- Step 1: Insert products with stock_on_hand = 0 initially
-- Step 2: Insert STOCK_IN stock_movements to set initial stock
--         (trigger fn_apply_stock_movement will update stock_on_hand)

-- PRD-BHN-001: PVC Super Ketebalan 0.25
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000001',
    'PRD-BHN-001',
    'PVC Super Ketebalan 0.25',
    'Kain PVC super tebal 0.25mm lentur waterproof premium untuk jas hujan setelan dan mantel berkualitas tinggi tahan badai ekstrem.',
    'b2c3d4e5-0002-0002-0002-000000000001', -- Material Jas Hujan
    'a1b2c3d4-0001-0001-0001-000000000001', -- Meter
    35000.00,
    0, 0, 20,
    '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
    TRUE, TRUE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-BHN-002: PVC New Fantastik Ketebalan 0.18
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000002',
    'PRD-BHN-002',
    'PVC New Fantastik Ketebalan 0.18',
    'Bahan PVC New Fantastik ketebalan 0.18mm warna Navy elegan, lentur, tahan robek, dan 100% kedap air.',
    'b2c3d4e5-0002-0002-0002-000000000001', -- Material Jas Hujan
    'a1b2c3d4-0001-0001-0001-000000000001', -- Meter
    28000.00,
    0, 0, 25,
    '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg',
    TRUE, FALSE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-BHN-003: PVC Idola Ketebalan 0.18
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000003',
    'PRD-BHN-003',
    'PVC Idola Ketebalan 0.18',
    'Kain PVC Idola ketebalan 0.18mm warna Hijau Army kokoh dan lentur, sangat populer untuk konveksi jas hujan lapangan.',
    'b2c3d4e5-0002-0002-0002-000000000001', -- Material Jas Hujan
    'a1b2c3d4-0001-0001-0001-000000000001', -- Meter
    25000.00,
    0, 0, 15,
    '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauArmy.jpeg',
    TRUE, TRUE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-BHN-004: PVC Elite Ketebalan 0.15
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000004',
    'PRD-BHN-004',
    'PVC Elite Ketebalan 0.15',
    'Material PVC Elite ketebalan 0.15mm Sage Green elastis, ekonomis, ringan, dan mudah diproses seam sealing.',
    'b2c3d4e5-0002-0002-0002-000000000001', -- Material Jas Hujan
    'a1b2c3d4-0001-0001-0001-000000000001', -- Meter
    22000.00,
    0, 0, 30,
    '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg',
    TRUE, FALSE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-ALT-001: Kancing Snap (Hitam/Putih)
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000005',
    'PRD-ALT-001',
    'Kancing Snap (Hitam/Putih)',
    'Kancing snap button jepret polyacetal resin hitam dan putih tahan karat, cengkeraman kuat, dan aman dicuci berulang kali.',
    'b2c3d4e5-0002-0002-0002-000000000003', -- Kancing
    'a1b2c3d4-0001-0001-0001-000000000002', -- Pcs
    500.00,
    0, 0, 500,
    '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingALL.jpeg',
    TRUE, TRUE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-ALT-002: Tali Kur / Hoddie (Hitam/Putih)
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000006',
    'PRD-ALT-002',
    'Tali Kur / Hoddie (Hitam/Putih)',
    'Tali kur / hoodie serbaguna untuk kerutan tudung kepala jas hujan, lentur dan tidak mudah berserabut.',
    'b2c3d4e5-0002-0002-0002-000000000005', -- Aksesori
    'a1b2c3d4-0001-0001-0001-000000000001', -- Meter
    1500.00,
    0, 0, 100,
    '/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddieALL.jpeg',
    TRUE, FALSE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-ALT-003: Resleting Waterproof (Hitam/Putih)
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000007',
    'PRD-ALT-003',
    'Resleting Waterproof (Hitam/Putih)',
    'Resleting ritsleting anti rembes dengan seal waterproof TPU matte finish, tahan air hujan lebat dan anti macet.',
    'b2c3d4e5-0002-0002-0002-000000000002', -- Resleting
    'a1b2c3d4-0001-0001-0001-000000000002', -- Pcs
    8500.00,
    0, 0, 50,
    '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
    TRUE, TRUE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-ALT-004: Skotlet Reflektor (Kain & Plastik)
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000008',
    'PRD-ALT-004',
    'Skotlet Reflektor (Kain & Plastik)',
    'Pita reflektif pemantul cahaya skotlet standar safety rider untuk keselamatan berkendara di malam hari.',
    'b2c3d4e5-0002-0002-0002-000000000005', -- Aksesori
    'a1b2c3d4-0001-0001-0001-000000000003', -- Roll
    12000.00,
    0, 0, 10,
    '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg',
    TRUE, FALSE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-ALT-005: Seam Sealing Tape (Silent Weath)
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000009',
    'PRD-ALT-005',
    'Seam Sealing Tape (Silent Weath)',
    'Pita perekat seam sealing hot melt untuk menambal dan menutup jalur jahitan jas hujan agar kedap air 100%.',
    'b2c3d4e5-0002-0002-0002-000000000005', -- Aksesori
    'a1b2c3d4-0001-0001-0001-000000000003', -- Roll
    4500.00,
    0, 0, 20,
    '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp',
    TRUE, TRUE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-ALT-006: Stopper Lobi-Lobi (Hitam/Putih)
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000010',
    'PRD-ALT-006',
    'Stopper Lobi-Lobi (Hitam/Putih)',
    'Stopper tali lobi-lobi pegas internal kuat untuk mengunci tali serut hoodie jas hujan agar tidak lepas ditiup angin.',
    'b2c3d4e5-0002-0002-0002-000000000005', -- Aksesori
    'a1b2c3d4-0001-0001-0001-000000000002', -- Pcs
    1000.00,
    0, 0, 200,
    '/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobiLobiALL.jpg',
    TRUE, FALSE
) ON CONFLICT (product_code) DO NOTHING;

-- PRD-ALT-007: Karet Elastis (2cm - 2.5cm) [Out of Stock intentionally]
INSERT INTO products (id, product_code, name, description, category_id, unit_id, price,
                      stock_on_hand, reserved_quantity, minimum_stock, image_url, is_active, is_featured)
VALUES (
    'c3d4e5f6-0003-0003-0003-000000000011',
    'PRD-ALT-007',
    'Karet Elastis (2cm - 2.5cm)',
    'Karet elastis tenun kuat lebar 2cm - 2.5cm untuk ban pinggang dan pergelangan jas hujan.',
    'b2c3d4e5-0002-0002-0002-000000000004', -- Karet
    'a1b2c3d4-0001-0001-0001-000000000001', -- Meter
    3500.00,
    0, 0, 50,
    '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikALL.jpeg',
    TRUE, FALSE
) ON CONFLICT (product_code) DO NOTHING;

-- ============================================================
-- INITIAL STOCK MOVEMENTS
-- Set initial stock_on_hand via STOCK_IN movements
-- The trigger fn_apply_stock_movement will update products.stock_on_hand
-- PRD-ALT-007 (Karet Elastis) intentionally stays at 0 (out of stock demo)
-- ============================================================

-- We need an admin user first to reference as created_by_id
-- Admin user is created below, then referenced in movements

-- ============================================================
-- ADMIN USER (seed)
-- Password: 'EnsteinAdmin2026!' — BCrypt hash (cost=10)
-- In production, override via ADMIN_EMAIL / ADMIN_PASSWORD env vars
-- ============================================================
INSERT INTO users (id, full_name, email, password_hash, phone, role, is_active)
VALUES (
    'd4e5f6a7-0004-0004-0004-000000000001',
    'Admin Toko Enstein',
    'admin@ensteinstore.com',
    -- BCrypt hash of 'EnsteinAdmin2026!' (cost=10)
    -- CHANGE THIS IN PRODUCTION via environment variable!
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2',
    '+62 838 7694 2484',
    'ADMIN',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO admins (id)
VALUES ('d4e5f6a7-0004-0004-0004-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STOCK_IN movements — sets initial stock via trigger
-- ============================================================
INSERT INTO stock_movements (product_id, movement_type, quantity,
                              stock_before, stock_after, reserved_before, reserved_after,
                              notes, created_by_id, reference_type)
VALUES
    -- PRD-BHN-001: 150 meter
    ('c3d4e5f6-0003-0003-0003-000000000001', 'STOCK_IN', 150,   0, 150,  0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT'),
    -- PRD-BHN-002: 200 meter
    ('c3d4e5f6-0003-0003-0003-000000000002', 'STOCK_IN', 200,   0, 200,  0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT'),
    -- PRD-BHN-003: 120 meter
    ('c3d4e5f6-0003-0003-0003-000000000003', 'STOCK_IN', 120,   0, 120,  0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT'),
    -- PRD-BHN-004: 300 meter
    ('c3d4e5f6-0003-0003-0003-000000000004', 'STOCK_IN', 300,   0, 300,  0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT'),
    -- PRD-ALT-001: 5000 pcs
    ('c3d4e5f6-0003-0003-0003-000000000005', 'STOCK_IN', 5000,  0, 5000, 0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT'),
    -- PRD-ALT-002: 1000 meter
    ('c3d4e5f6-0003-0003-0003-000000000006', 'STOCK_IN', 1000,  0, 1000, 0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT'),
    -- PRD-ALT-003: 800 pcs
    ('c3d4e5f6-0003-0003-0003-000000000007', 'STOCK_IN', 800,   0, 800,  0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT'),
    -- PRD-ALT-004: 50 roll
    ('c3d4e5f6-0003-0003-0003-000000000008', 'STOCK_IN', 50,    0, 50,   0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT'),
    -- PRD-ALT-005: 150 roll
    ('c3d4e5f6-0003-0003-0003-000000000009', 'STOCK_IN', 150,   0, 150,  0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT'),
    -- PRD-ALT-006: 2000 pcs
    ('c3d4e5f6-0003-0003-0003-000000000010', 'STOCK_IN', 2000,  0, 2000, 0, 0, 'Initial stock — seed data', 'd4e5f6a7-0004-0004-0004-000000000001', 'ADJUSTMENT')
    -- PRD-ALT-007: NO stock movement → stock remains 0 (Out of Stock demo)
;
