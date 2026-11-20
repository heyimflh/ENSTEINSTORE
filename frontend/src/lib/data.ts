export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  allowDecimal: boolean;
  stock: number;
  image: string;
  imageUrl?: string;
  isFeatured: boolean;
  isNew: boolean;
}

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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauArmy.jpeg",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddieALL.jpeg",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobilobiAll.jpg",
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
    imageUrl: "/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikAll.jpeg",
    isFeatured: false,
    isNew: false
  }
];
