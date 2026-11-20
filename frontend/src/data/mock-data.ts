import { Category, Product, UserProfile } from '../types/store';
import { PRODUCTS } from './products';

export const STORE_INFO = {
  name: 'ENSTEINSTORE',
  owner: 'Toko Enstein',
  tagline: 'Your Trusted Store for Rainwear Materials and Accessories',
  subtagline: 'Toko yang bergerak di bidang penjualan bahan jas hujan (kain/material) beserta komponen pendukungnya seperti kancing, resleting, dan karet.',
  phone: '+62 838 7694 2484',
  whatsapp: '+62 838 7694 2484',
  email: 'sales@ensteinstore.com',
  address: 'Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01), Jawa Tengah',
  hours: 'Senin - Sabtu: 08.00 - 17.00 WIB (Minggu Libur)',
  logoUrl: '/ensteinlogo.png',
};

export const MOCK_USER: UserProfile = {
  name: 'Bu Rina (Konveksi Barokah)',
  email: 'rina.konveksi@gmail.com',
  phone: '081298765432',
  address: 'Jl. Rancabolang No. 14, Gedebage, Bandung',
  role: 'CUSTOMER',
  avatarUrl: '/images/foto-toko-enstein.jpeg',
};

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Material Jas Hujan',
    slug: 'material-jas-hujan',
    description: 'Kain PVC balon elastis, waterproof super tebal, dan material jas hujan berkualitas.',
    iconName: 'Layers',
    itemCount: 4,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
  },
  {
    id: 'cat-2',
    name: 'Resleting',
    slug: 'resleting',
    description: 'Resleting waterproof zipper, tarikan halus, dan kedap air.',
    iconName: 'GitCommitHorizontal',
    itemCount: 1,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
  },
  {
    id: 'cat-3',
    name: 'Kancing',
    slug: 'kancing',
    description: 'Kancing jepret snap button tahan karat dan kuat dicuci.',
    iconName: 'CircleDot',
    itemCount: 1,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
  },
  {
    id: 'cat-4',
    name: 'Karet',
    slug: 'karet',
    description: 'Karet elastis tenun untuk ban pinggang dan manset pergelangan.',
    iconName: 'Activity',
    itemCount: 1,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikAll.jpeg',
  },
  {
    id: 'cat-5',
    name: 'Aksesori',
    slug: 'aksesori',
    description: 'Seam sealing tape hot melt, tali kur hoodie, stopper lobi-lobi, dan skotlet reflektor.',
    iconName: 'Scissors',
    itemCount: 4,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg',
  },
];

export const MOCK_PRODUCTS: Product[] = PRODUCTS.map((p) => ({
  id: p.id,
  code: p.code,
  name: p.name,
  categoryId: p.categoryId,
  categoryName: p.category,
  category: p.category,
  price: p.price,
  unit: p.unit,
  allowDecimal: p.allowDecimal ?? false,
  stockOnHand: p.stockOnHand ?? p.stock,
  stock: p.stock,
  reservedQuantity: p.reservedQuantity ?? 0,
  minimumStock: p.minimumStock ?? 10,
  description: p.description,
  image: p.image,
  imageUrl: p.imageUrl,
  isActive: p.isActive,
  isFeatured: p.isFeatured,
  isNew: p.isNew,
  rating: p.rating ?? 4.9,
  salesCount: p.salesCount,
}));
