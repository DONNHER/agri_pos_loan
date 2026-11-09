/**
 * POS Multipurpose System Domain Model & Seed Data
 *
 * Supports agricultural cooperative trading:
 * - Units: box, product/piece, sack, kilogram
 * - Box product break-down into individual pieces
 * - Sack break-down into kilograms
 * - Roles: Cashier, Admin, Shareholder (Read-Only)
 * - Modules: Inventory & Breakdown, Sales Checkout (POS Register), Reports, Backups
 */

export type PosUnit = 'box' | 'piece' | 'sack' | 'kg';

export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  category: 'Fertilizers' | 'Seeds & Grains' | 'Agri-Chemicals' | 'Farm Tools' | 'Feeds & Supplements';
  unit: PosUnit;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  minThreshold: number;

  // Breakdown capability
  canBreakDown?: boolean;
  breakdownIntoUnit?: PosUnit;
  breakdownRatio?: number; // e.g., 1 box = 24 pieces; 1 sack = 50 kg
  breakdownTargetProductId?: string;
  parentProductId?: string;
}

export interface PosCartItem {
  product: PosProduct;
  quantity: number;
  subtotal: number;
}

export interface PosSaleItem {
  productId: string;
  sku: string;
  name: string;
  unit: PosUnit;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PosSaleRecord {
  id: string;
  receiptNumber: string;
  timestamp: string;
  cashierName: string;
  cashierRole: string;
  customerName?: string;
  customerType: 'Shareholder Member' | 'Walk-In Farmer' | 'Wholesale Buyer';
  items: PosSaleItem[];
  totalAmount: number;
  amountTendered: number;
  change: number;
  paymentMethod: 'Cash' | 'GCash' | 'Maya' | 'Shareholder Credit Line';
}

export interface PosBackupSnapshot {
  id: string;
  label: string;
  timestamp: string;
  productCount: number;
  salesCount: number;
  totalRevenue: number;
  checksum: string;
  dataJson: string;
}

export const INITIAL_POS_PRODUCTS: PosProduct[] = [
  // 1. Box product that can be sold per piece or converted
  {
    id: 'prod-box-seedling-tray',
    sku: 'AGR-BOX-01',
    name: 'Hybrid Corn Seed Packets (Master Box)',
    category: 'Seeds & Grains',
    unit: 'box',
    stock: 14,
    costPrice: 4200,
    sellingPrice: 5100,
    minThreshold: 3,
    canBreakDown: true,
    breakdownIntoUnit: 'piece',
    breakdownRatio: 20, // 20 packets per box
    breakdownTargetProductId: 'prod-pc-seedling-packet',
  },
  {
    id: 'prod-pc-seedling-packet',
    sku: 'AGR-PC-01',
    name: 'Hybrid Corn Seed Packet (Single 500g Pack)',
    category: 'Seeds & Grains',
    unit: 'piece',
    stock: 45,
    costPrice: 220,
    sellingPrice: 285,
    minThreshold: 15,
    parentProductId: 'prod-box-seedling-tray',
  },

  // 2. Sack product that can be sold per kilogram or converted
  {
    id: 'prod-sack-urea-46',
    sku: 'AGR-SCK-02',
    name: 'Premium Urea 46-0-0 Granular (50kg Sack)',
    category: 'Fertilizers',
    unit: 'sack',
    stock: 32,
    costPrice: 1650,
    sellingPrice: 1950,
    minThreshold: 8,
    canBreakDown: true,
    breakdownIntoUnit: 'kg',
    breakdownRatio: 50, // 50 kg per sack
    breakdownTargetProductId: 'prod-kg-urea-retail',
  },
  {
    id: 'prod-kg-urea-retail',
    sku: 'AGR-KG-02',
    name: 'Urea 46-0-0 Repack (Per Kilogram)',
    category: 'Fertilizers',
    unit: 'kg',
    stock: 125,
    costPrice: 34,
    sellingPrice: 44,
    minThreshold: 30,
    parentProductId: 'prod-sack-urea-46',
  },

  // 3. Another Sack -> Kg combo (Rice Bran / Feeds)
  {
    id: 'prod-sack-feeds-ricebran',
    sku: 'AGR-SCK-03',
    name: 'Co-op Fine Rice Bran D1 (50kg Sack)',
    category: 'Feeds & Supplements',
    unit: 'sack',
    stock: 18,
    costPrice: 720,
    sellingPrice: 890,
    minThreshold: 5,
    canBreakDown: true,
    breakdownIntoUnit: 'kg',
    breakdownRatio: 50,
    breakdownTargetProductId: 'prod-kg-ricebran-retail',
  },
  {
    id: 'prod-kg-ricebran-retail',
    sku: 'AGR-KG-03',
    name: 'Fine Rice Bran D1 (Per Kilogram)',
    category: 'Feeds & Supplements',
    unit: 'kg',
    stock: 80,
    costPrice: 15,
    sellingPrice: 21,
    minThreshold: 20,
    parentProductId: 'prod-sack-feeds-ricebran',
  },

  // 4. Box -> Piece (Bio-Pesticide ampoules)
  {
    id: 'prod-box-biopest',
    sku: 'AGR-BOX-04',
    name: 'Organic Neem Concentrate 100ml (Display Box of 24)',
    category: 'Agri-Chemicals',
    unit: 'box',
    stock: 9,
    costPrice: 2880,
    sellingPrice: 3600,
    minThreshold: 2,
    canBreakDown: true,
    breakdownIntoUnit: 'piece',
    breakdownRatio: 24,
    breakdownTargetProductId: 'prod-pc-biopest-single',
  },
  {
    id: 'prod-pc-biopest-single',
    sku: 'AGR-PC-04',
    name: 'Organic Neem Concentrate (Single 100ml Bottle)',
    category: 'Agri-Chemicals',
    unit: 'piece',
    stock: 36,
    costPrice: 125,
    sellingPrice: 165,
    minThreshold: 10,
    parentProductId: 'prod-box-biopest',
  },

  // 5. Standard Farm Tools (Sold per piece)
  {
    id: 'prod-pc-sickle',
    sku: 'AGR-TOOL-05',
    name: 'Hardened Steel Heavy-Duty Rice Sickle',
    category: 'Farm Tools',
    unit: 'piece',
    stock: 22,
    costPrice: 140,
    sellingPrice: 195,
    minThreshold: 6,
  },
  {
    id: 'prod-pc-sprayer-knapsack',
    sku: 'AGR-TOOL-06',
    name: '16L Manual Knapsack Sprayer with Brass Nozzle',
    category: 'Farm Tools',
    unit: 'piece',
    stock: 7,
    costPrice: 1100,
    sellingPrice: 1450,
    minThreshold: 2,
  },
];

export const INITIAL_POS_SALES: PosSaleRecord[] = [
  {
    id: 'sale-101',
    receiptNumber: 'RCP-202611-0941',
    timestamp: 'Nov 04, 2026 · 09:14 AM',
    cashierName: 'Maria Santos (Cashier)',
    cashierRole: 'CASHIER',
    customerName: 'Eduardo Ramos (Shareholder)',
    customerType: 'Shareholder Member',
    items: [
      {
        productId: 'prod-sack-urea-46',
        sku: 'AGR-SCK-02',
        name: 'Premium Urea 46-0-0 Granular (50kg Sack)',
        unit: 'sack',
        unitPrice: 1950,
        quantity: 2,
        subtotal: 3900,
      },
      {
        productId: 'prod-pc-seedling-packet',
        sku: 'AGR-PC-01',
        name: 'Hybrid Corn Seed Packet (Single 500g Pack)',
        unit: 'piece',
        unitPrice: 285,
        quantity: 4,
        subtotal: 1140,
      },
    ],
    totalAmount: 5040,
    amountTendered: 5040,
    change: 0,
    paymentMethod: 'Shareholder Credit Line',
  },
  {
    id: 'sale-102',
    receiptNumber: 'RCP-202611-0942',
    timestamp: 'Nov 04, 2026 · 11:32 AM',
    cashierName: 'Maria Santos (Cashier)',
    cashierRole: 'CASHIER',
    customerName: 'Barangay 4 Farmers Cluster',
    customerType: 'Walk-In Farmer',
    items: [
      {
        productId: 'prod-kg-urea-retail',
        sku: 'AGR-KG-02',
        name: 'Urea 46-0-0 Repack (Per Kilogram)',
        unit: 'kg',
        unitPrice: 44,
        quantity: 15,
        subtotal: 660,
      },
      {
        productId: 'prod-kg-ricebran-retail',
        sku: 'AGR-KG-03',
        name: 'Fine Rice Bran D1 (Per Kilogram)',
        unit: 'kg',
        unitPrice: 21,
        quantity: 20,
        subtotal: 420,
      },
    ],
    totalAmount: 1080,
    amountTendered: 1100,
    change: 20,
    paymentMethod: 'Cash',
  },
  {
    id: 'sale-103',
    receiptNumber: 'RCP-202611-0943',
    timestamp: 'Nov 04, 2026 · 02:45 PM',
    cashierName: 'System Admin (POS Desk)',
    cashierRole: 'ADMIN',
    customerName: 'Bukidnon Agro Cooperative',
    customerType: 'Wholesale Buyer',
    items: [
      {
        productId: 'prod-box-biopest',
        sku: 'AGR-BOX-04',
        name: 'Organic Neem Concentrate 100ml (Display Box of 24)',
        unit: 'box',
        unitPrice: 3600,
        quantity: 1,
        subtotal: 3600,
      },
      {
        productId: 'prod-pc-sprayer-knapsack',
        sku: 'AGR-TOOL-06',
        name: '16L Manual Knapsack Sprayer with Brass Nozzle',
        unit: 'piece',
        unitPrice: 1450,
        quantity: 1,
        subtotal: 1450,
      },
    ],
    totalAmount: 5050,
    amountTendered: 5050,
    change: 0,
    paymentMethod: 'GCash',
  },
];
