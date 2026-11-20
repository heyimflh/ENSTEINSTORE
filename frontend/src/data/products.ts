export type CategoryName =
  | 'Semua'
  | 'Material Jas Hujan'
  | 'Resleting'
  | 'Kancing'
  | 'Karet'
  | 'Aksesori';

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category: 'Material Jas Hujan' | 'Resleting' | 'Kancing' | 'Karet' | 'Aksesori';
  categoryName?: string;
  price: number;
  unit: 'meter' | 'pcs' | 'roll';
  allowDecimal?: boolean;
  stock: number;
  stockOnHand?: number;
  reservedQuantity?: number;
  minimumStock?: number;
  description: string;
  image: string;
  imageUrl: string;
  isActive: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  createdAt: string;
  salesCount: number;
  rating?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const formatIDR = (val: number): string =>
  'Rp ' + val.toLocaleString('id-ID');

// Export central raw products data matching user mapping
export const products = [
  // --- KATEGORI BAHAN (MATERIAL JAS HUJAN) ---
  {
    id: "PRD-BHN-001",
    name: "PVC Super Ketebalan 0.25",
    category: "Material Jas Hujan",
    price: 35000,
    unit: "meter",
    allowDecimal: true,
    stock: 150,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg",
    isFeatured: true,
    isNew: false
  },
  {
    id: "PRD-BHN-002",
    name: "PVC New Fantastik Ketebalan 0.18",
    category: "Material Jas Hujan",
    price: 28000,
    unit: "meter",
    allowDecimal: true,
    stock: 200,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg",
    isFeatured: false,
    isNew: true
  },
  {
    id: "PRD-BHN-003",
    name: "PVC Idola Ketebalan 0.18",
    category: "Material Jas Hujan",
    price: 25000,
    unit: "meter",
    allowDecimal: true,
    stock: 120,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauArmy.jpeg",
    isFeatured: true,
    isNew: false
  },
  {
    id: "PRD-BHN-004",
    name: "PVC Elite Ketebalan 0.15",
    category: "Material Jas Hujan",
    price: 22000,
    unit: "meter",
    allowDecimal: true,
    stock: 300,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg",
    isFeatured: false,
    isNew: true
  },

  // --- KATEGORI ALAT (KOMPONEN & AKSESORI) ---
  {
    id: "PRD-ALT-001",
    name: "Kancing Snap (Hitam/Putih)",
    category: "Kancing",
    price: 500,
    unit: "pcs",
    allowDecimal: false,
    stock: 5000,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg",
    isFeatured: true,
    isNew: false
  },
  {
    id: "PRD-ALT-002",
    name: "Tali Kur / Hoddie (Hitam/Putih)",
    category: "Aksesori",
    price: 1500,
    unit: "meter",
    allowDecimal: true,
    stock: 1000,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddieALL.jpeg",
    isFeatured: false,
    isNew: false
  },
  {
    id: "PRD-ALT-003",
    name: "Resleting Waterproof (Hitam/Putih)",
    category: "Resleting",
    price: 8500,
    unit: "pcs",
    allowDecimal: false,
    stock: 800,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg",
    isFeatured: true,
    isNew: false
  },
  {
    id: "PRD-ALT-004",
    name: "Skotlet Reflektor (Kain & Plastik)",
    category: "Aksesori",
    price: 12000,
    unit: "roll",
    allowDecimal: false,
    stock: 50,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg",
    isFeatured: false,
    isNew: true
  },
  {
    id: "PRD-ALT-005",
    name: "Seam Sealing Tape (Silent Weath)",
    category: "Aksesori",
    price: 4500,
    unit: "roll",
    allowDecimal: false,
    stock: 150,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp",
    isFeatured: true,
    isNew: true
  },
  {
    id: "PRD-ALT-006",
    name: "Stopper Lobi-Lobi (Hitam/Putih)",
    category: "Aksesori",
    price: 1000,
    unit: "pcs",
    allowDecimal: false,
    stock: 2000,
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobilobiAll.jpg",
    isFeatured: false,
    isNew: false
  },
  {
    id: "PRD-ALT-007",
    name: "Karet Elastis (2cm - 2.5cm)",
    category: "Karet",
    price: 3500,
    unit: "meter",
    allowDecimal: true,
    stock: 0, // Set to 0 to test Out of Stock UI
    image: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikAll.jpeg",
    isFeatured: false,
    isNew: false
  }
];

export const PRODUCTS: Product[] = [
  // --- KATEGORI BAHAN (MATERIAL JAS HUJAN) ---
  {
    id: 'PRD-BHN-001',
    code: 'PRD-BHN-001',
    name: 'PVC Super Ketebalan 0.25',
    categoryId: 'cat-1',
    category: 'Material Jas Hujan',
    categoryName: 'Material Jas Hujan',
    price: 35000,
    unit: 'meter',
    allowDecimal: true,
    stock: 150,
    stockOnHand: 150,
    reservedQuantity: 0,
    minimumStock: 20,
    description:
      'Kain PVC super tebal 0.25mm lentur waterproof premium untuk jas hujan setelan dan mantel berkualitas tinggi tahan badai ekstrem.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
    isActive: true,
    isFeatured: true,
    isNew: false,
    createdAt: '2026-03-01T08:00:00Z',
    salesCount: 420,
    rating: 5.0,
  },
  {
    id: 'PRD-BHN-002',
    code: 'PRD-BHN-002',
    name: 'PVC New Fantastik Ketebalan 0.18',
    categoryId: 'cat-1',
    category: 'Material Jas Hujan',
    categoryName: 'Material Jas Hujan',
    price: 28000,
    unit: 'meter',
    allowDecimal: true,
    stock: 200,
    stockOnHand: 200,
    reservedQuantity: 0,
    minimumStock: 25,
    description:
      'Bahan PVC New Fantastik ketebalan 0.18mm warna Navy elegan, lentur, tahan robek, dan 100% kedap air.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg',
    isActive: true,
    isFeatured: false,
    isNew: true,
    createdAt: '2026-10-15T09:30:00Z',
    salesCount: 210,
    rating: 4.8,
  },
  {
    id: 'PRD-BHN-003',
    code: 'PRD-BHN-003',
    name: 'PVC Idola Ketebalan 0.18',
    categoryId: 'cat-1',
    category: 'Material Jas Hujan',
    categoryName: 'Material Jas Hujan',
    price: 25000,
    unit: 'meter',
    allowDecimal: true,
    stock: 120,
    stockOnHand: 120,
    reservedQuantity: 0,
    minimumStock: 15,
    description:
      'Kain PVC Idola ketebalan 0.18mm warna Hijau Army kokoh dan lentur, sangat populer untuk konveksi jas hujan lapangan.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauArmy.jpeg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauArmy.jpeg',
    isActive: true,
    isFeatured: true,
    isNew: false,
    createdAt: '2026-04-10T11:00:00Z',
    salesCount: 310,
    rating: 4.9,
  },
  {
    id: 'PRD-BHN-004',
    code: 'PRD-BHN-004',
    name: 'PVC Elite Ketebalan 0.15',
    categoryId: 'cat-1',
    category: 'Material Jas Hujan',
    categoryName: 'Material Jas Hujan',
    price: 22000,
    unit: 'meter',
    allowDecimal: true,
    stock: 300,
    stockOnHand: 300,
    reservedQuantity: 0,
    minimumStock: 30,
    description:
      'Material PVC Elite ketebalan 0.15mm Sage Green elastis, ekonomis, ringan, dan mudah diproses seam sealing.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg',
    isActive: true,
    isFeatured: false,
    isNew: true,
    createdAt: '2026-11-01T10:00:00Z',
    salesCount: 180,
    rating: 4.7,
  },

  // --- KATEGORI ALAT (KOMPONEN & AKSESORI) ---
  {
    id: 'PRD-ALT-001',
    code: 'PRD-ALT-001',
    name: 'Kancing Snap (Hitam/Putih)',
    categoryId: 'cat-3',
    category: 'Kancing',
    categoryName: 'Kancing',
    price: 500,
    unit: 'pcs',
    allowDecimal: false,
    stock: 5000,
    stockOnHand: 5000,
    reservedQuantity: 0,
    minimumStock: 500,
    description:
      'Kancing snap button jepret polyacetal resin hitam dan putih tahan karat, cengkeraman kuat, dan aman dicuci berulang kali.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
    isActive: true,
    isFeatured: true,
    isNew: false,
    createdAt: '2026-02-14T07:10:00Z',
    salesCount: 1200,
    rating: 5.0,
  },
  {
    id: 'PRD-ALT-002',
    code: 'PRD-ALT-002',
    name: 'Tali Kur / Hoddie (Hitam/Putih)',
    categoryId: 'cat-5',
    category: 'Aksesori',
    categoryName: 'Aksesori',
    price: 1500,
    unit: 'meter',
    allowDecimal: true,
    stock: 1000,
    stockOnHand: 1000,
    reservedQuantity: 0,
    minimumStock: 100,
    description:
      'Tali kur / hoodie serbaguna untuk kerutan tudung kepala jas hujan, lentur dan tidak mudah berserabut.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddieALL.jpeg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddieALL.jpeg',
    isActive: true,
    isFeatured: false,
    isNew: false,
    createdAt: '2026-05-18T08:00:00Z',
    salesCount: 450,
    rating: 4.8,
  },
  {
    id: 'PRD-ALT-003',
    code: 'PRD-ALT-003',
    name: 'Resleting Waterproof (Hitam/Putih)',
    categoryId: 'cat-2',
    category: 'Resleting',
    categoryName: 'Resleting',
    price: 8500,
    unit: 'pcs',
    allowDecimal: false,
    stock: 800,
    stockOnHand: 800,
    reservedQuantity: 0,
    minimumStock: 50,
    description:
      'Resleting ritsleting anti rembes dengan seal waterproof TPU matte finish, tahan air hujan lebat dan anti macet.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
    isActive: true,
    isFeatured: true,
    isNew: false,
    createdAt: '2026-08-20T10:00:00Z',
    salesCount: 890,
    rating: 4.9,
  },
  {
    id: 'PRD-ALT-004',
    code: 'PRD-ALT-004',
    name: 'Skotlet Reflektor (Kain & Plastik)',
    categoryId: 'cat-5',
    category: 'Aksesori',
    categoryName: 'Aksesori',
    price: 12000,
    unit: 'roll',
    allowDecimal: false,
    stock: 50,
    stockOnHand: 50,
    reservedQuantity: 0,
    minimumStock: 10,
    description:
      'Pita reflektif pemantul cahaya skotlet standar safety rider untuk keselamatan berkendara di malam hari.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg',
    isActive: true,
    isFeatured: false,
    isNew: true,
    createdAt: '2026-10-25T14:20:00Z',
    salesCount: 160,
    rating: 4.9,
  },
  {
    id: 'PRD-ALT-005',
    code: 'PRD-ALT-005',
    name: 'Seam Sealing Tape (Silent Weath)',
    categoryId: 'cat-5',
    category: 'Aksesori',
    categoryName: 'Aksesori',
    price: 4500,
    unit: 'roll',
    allowDecimal: false,
    stock: 150,
    stockOnHand: 150,
    reservedQuantity: 0,
    minimumStock: 20,
    description:
      'Pita perekat seam sealing hot melt untuk menambal dan menutup jalur jahitan jas hujan agar kedap air 100%.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp',
    isActive: true,
    isFeatured: true,
    isNew: true,
    createdAt: '2026-11-05T08:30:00Z',
    salesCount: 670,
    rating: 5.0,
  },
  {
    id: 'PRD-ALT-006',
    code: 'PRD-ALT-006',
    name: 'Stopper Lobi-Lobi (Hitam/Putih)',
    categoryId: 'cat-5',
    category: 'Aksesori',
    categoryName: 'Aksesori',
    price: 1000,
    unit: 'pcs',
    allowDecimal: false,
    stock: 2000,
    stockOnHand: 2000,
    reservedQuantity: 0,
    minimumStock: 200,
    description:
      'Stopper tali lobi-lobi pegas internal kuat untuk mengunci tali serut hoodie jas hujan agar tidak lepas ditiup angin.',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobilobiAll.jpg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobilobiAll.jpg',
    isActive: true,
    isFeatured: false,
    isNew: false,
    createdAt: '2026-07-14T11:45:00Z',
    salesCount: 780,
    rating: 4.8,
  },
  {
    id: 'PRD-ALT-007',
    code: 'PRD-ALT-007',
    name: 'Karet Elastis (2cm - 2.5cm)',
    categoryId: 'cat-4',
    category: 'Karet',
    categoryName: 'Karet',
    price: 3500,
    unit: 'meter',
    allowDecimal: true,
    stock: 0, // Set to 0 to test Out of Stock UI
    stockOnHand: 0,
    reservedQuantity: 0,
    minimumStock: 50,
    description:
      'Karet elastis tenun kuat lebar 2cm - 2.5cm untuk ban pinggang dan pergelangan jas hujan. [Stok Habis]',
    image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikAll.jpeg',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikAll.jpeg',
    isActive: true,
    isFeatured: false,
    isNew: false,
    createdAt: '2026-01-10T10:00:00Z',
    salesCount: 520,
    rating: 4.7,
  },
];

export const FEATURED_PRODUCTS = PRODUCTS.filter(
  (p) => p.isActive && p.isFeatured
);

export const NEW_PRODUCTS = PRODUCTS.filter(
  (p) => p.isActive && p.isNew
);
