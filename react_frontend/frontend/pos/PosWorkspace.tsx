import React, { useState } from 'react';
import {
  Archive,
  BarChart3,
  Boxes,
  CheckCircle2,
  Package,
  Receipt,
  ShoppingCart,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  formatPHP,
  PlatformState,
  UserRole,
} from '../loan/shared/creditData';
import { AdminUsersView } from '../loan/admin/AdminUsersView';
import {
  INITIAL_POS_PRODUCTS,
  INITIAL_POS_SALES,
  PosBackupSnapshot,
  PosProduct,
  PosSaleRecord,
} from './posData';
import { PosCheckoutView } from './PosCheckoutView';
import { PosInventoryView } from './PosInventoryView';
import { PosReportsView } from './PosReportsView';
import { PosBackupsView } from './PosBackupsView';
import { PosSubTab } from './posNavigation';

export type { PosSubTab };
export type PosRole = 'CASHIER' | 'ADMIN' | 'SHAREHOLDER';

interface PosWorkspaceProps {
  initialRole?: PosRole;
  currentUserName?: string;
  onExitPos?: () => void;
  activeTab?: PosSubTab;
  onSelectTab?: (tab: PosSubTab) => void;
  platformState?: PlatformState;
  currentAdminId?: string;
  userSearch?: string;
  onChangeUserSearch?: (s: string) => void;
  onImpersonateUser?: (id: string) => void;
  onCreateUser?: (payload: {
    fullName: string;
    handle: string;
    email: string;
    phone: string;
    role: UserRole;
    totalLimit: number;
    shareCapital: number;
  }) => void;
  onUpdateUserAdmin?: (
    userId: string,
    updates: {
      role: UserRole;
      status: 'ACTIVE' | 'SUSPENDED';
      totalLimit: number;
      shareCapital: number;
      kycVerified: boolean;
    }
  ) => void;
  onResetUserPin?: (id: string) => void;
}

export const PosWorkspace: React.FC<PosWorkspaceProps> = ({
  initialRole = 'CASHIER',
  currentUserName = 'Maria Santos',
  onExitPos,
  activeTab: controlledActiveTab,
  onSelectTab: onControlledSelectTab,
  platformState,
  currentAdminId = 'user-admin-1',
  userSearch = '',
  onChangeUserSearch,
  onImpersonateUser,
  onCreateUser,
  onUpdateUserAdmin,
  onResetUserPin,
}) => {
  const [internalTab, setInternalTab] = useState<PosSubTab>('checkout');
  const activeTab = controlledActiveTab ?? internalTab;
  const setActiveTab = (t: PosSubTab) => {
    setInternalTab(t);
    onControlledSelectTab?.(t);
  };

  const [posRole, setPosRole] = useState<PosRole>(initialRole);
  const [localSearch, setLocalSearch] = useState('');
  const [products, setProducts] = useState<PosProduct[]>(() => {
    const saved = localStorage.getItem('pos_products_state');
    return saved ? JSON.parse(saved) : INITIAL_POS_PRODUCTS;
  });
  const [sales, setSales] = useState<PosSaleRecord[]>(() => {
    const saved = localStorage.getItem('pos_sales_state');
    return saved ? JSON.parse(saved) : INITIAL_POS_SALES;
  });
  const [backups, setBackups] = useState<PosBackupSnapshot[]>([
    {
      id: 'snap-seed-01',
      label: 'Initial Co-op Trading Inventory Baseline',
      timestamp: 'Nov 04, 2026 · 08:00 AM',
      productCount: INITIAL_POS_PRODUCTS.length,
      salesCount: INITIAL_POS_SALES.length,
      totalRevenue: INITIAL_POS_SALES.reduce((a, b) => a + b.totalAmount, 0),
      checksum: 'SHA256-POS-INITIAL',
      dataJson: JSON.stringify({ products: INITIAL_POS_PRODUCTS, sales: INITIAL_POS_SALES }),
    },
  ]);
  const [selectedReceipt, setSelectedReceipt] = useState<PosSaleRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCompleteSale = (
    saleData: Omit<PosSaleRecord, 'id' | 'receiptNumber' | 'timestamp'>
  ) => {
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }) + ' · ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const receiptNum = `RCP-202611-${Math.floor(1000 + Math.random() * 8999)}`;
    const newRecord: PosSaleRecord = {
      ...saleData,
      id: `sale-${Date.now()}`,
      receiptNumber: receiptNum,
      timestamp: timestampStr,
    };

    // Deduct inventory
    setProducts((prev) =>
      prev.map((prod) => {
        const itemSold = saleData.items.find((i) => i.productId === prod.id);
        if (itemSold) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - itemSold.quantity),
          };
        }
        return prod;
      })
    );

    setSales((prev) => [newRecord, ...prev]);
    setSelectedReceipt(newRecord);
    notify(`Completed sale ${receiptNum} · ${formatPHP(newRecord.totalAmount)}`);
  };

  const handleAddProduct = (newProdData: Omit<PosProduct, 'id'>) => {
    const newId = `prod-${newProdData.unit}-${Date.now()}`;
    const newProd: PosProduct = {
      ...newProdData,
      id: newId,
    };

    // If it's a breakdown product and we don't have a retail child product yet, auto-create matching retail product
    let extraProduct: PosProduct | undefined;
    if (newProd.canBreakDown && newProd.breakdownIntoUnit && newProd.breakdownRatio) {
      const childId = `prod-${newProd.breakdownIntoUnit}-${Date.now()}-retail`;
      newProd.breakdownTargetProductId = childId;
      extraProduct = {
        id: childId,
        sku: `${newProd.sku}-RTL`,
        name: `${newProd.name} (Per ${newProd.breakdownIntoUnit.toUpperCase()})`,
        category: newProd.category,
        unit: newProd.breakdownIntoUnit,
        stock: 0,
        costPrice: Math.round((newProd.costPrice / newProd.breakdownRatio) * 100) / 100,
        sellingPrice: Math.round((newProd.sellingPrice / newProd.breakdownRatio) * 1.15 * 100) / 100,
        minThreshold: 10,
        parentProductId: newId,
      };
    }

    setProducts((prev) => (extraProduct ? [newProd, extraProduct, ...prev] : [newProd, ...prev]));
    notify(`Added ${newProd.name} to POS catalog`);
  };

  const handleBreakdownProduct = (parentProductId: string, qtyToConvert: number) => {
    const parent = products.find((p) => p.id === parentProductId);
    if (!parent || parent.stock < qtyToConvert) return;

    const child = products.find((p) => p.id === parent.breakdownTargetProductId);
    const ratio = parent.breakdownRatio || 1;
    const addedRetailStock = qtyToConvert * ratio;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === parentProductId) {
          return { ...p, stock: p.stock - qtyToConvert };
        }
        if (child && p.id === child.id) {
          return { ...p, stock: p.stock + addedRetailStock };
        }
        return p;
      })
    );

    notify(
      `Converted ${qtyToConvert} ${parent.unit}(s) of "${parent.name}" into +${addedRetailStock} ${parent.breakdownIntoUnit}s!`
    );
  };

  const handleAdjustStock = (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );
    notify('Stock adjustment applied');
  };

  const handleCreateSnapshot = (label: string) => {
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }) + ' · ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const totalRev = sales.reduce((a, b) => a + b.totalAmount, 0);
    const snap: PosBackupSnapshot = {
      id: `snap-${Date.now()}`,
      label,
      timestamp: timestampStr,
      productCount: products.length,
      salesCount: sales.length,
      totalRevenue: totalRev,
      checksum: `SHA256-POS-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      dataJson: JSON.stringify({ products, sales }),
    };

    setBackups((prev) => [snap, ...prev]);
    notify(`Created snapshot "${label}"`);
  };

  const handleRestoreSnapshot = (snapshot: PosBackupSnapshot) => {
    try {
      const parsed = JSON.parse(snapshot.dataJson);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.sales)) {
        setProducts(parsed.products);
        setSales(parsed.sales);
        notify(`Restored POS state from "${snapshot.label}"`);
      }
    } catch {
      notify('Failed to restore snapshot data');
    }
  };

  const handleImportBackupJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.sales)) {
        setProducts(parsed.products);
        setSales(parsed.sales);
        notify(`Imported ${parsed.products.length} products and ${parsed.sales.length} sales from JSON backup`);
      } else {
        notify('Invalid POS backup JSON schema');
      }
    } catch {
      notify('Could not parse JSON backup file');
    }
  };

  const handleResetFactoryData = () => {
    setProducts(INITIAL_POS_PRODUCTS);
    setSales(INITIAL_POS_SALES);
    notify('POS system reset to initial agricultural co-op seed');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-inverse text-ink-inverse px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium max-w-[92vw]">
          <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* POS Top Control Bar: Modules & Role View Selector */}
      <section className="bg-surface border border-line rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-ink-secondary">
              <span className="font-semibold text-brand">Agri-Trading Module</span>
              <span>·</span>
              <span>Box, Sack, Piece &amp; Kg Multi-Unit Engine</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-ink mt-0.5">
              Multipurpose Cooperative POS &amp; Inventory
            </h1>
          </div>
        </div>

        {/* Role Switcher (Cashier / Admin / Shareholder Read-Only) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-subtle rounded-xl text-xs">
            <span className="px-2 font-medium text-ink-secondary hidden sm:inline">Role View:</span>
            <button
              type="button"
              onClick={() => setPosRole('CASHIER')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                posRole === 'CASHIER'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Cashier
            </button>
            <button
              type="button"
              onClick={() => setPosRole('ADMIN')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                posRole === 'ADMIN'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setPosRole('SHAREHOLDER')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                posRole === 'SHAREHOLDER'
                  ? 'bg-inverse text-ink-inverse shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Shareholder (Read-Only)
            </button>
          </div>

          {onExitPos && (
            <button
              type="button"
              onClick={onExitPos}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-canvas hover:bg-subtle border border-line text-xs font-semibold text-ink cursor-pointer"
            >
              Return to Credit App
            </button>
          )}
        </div>
      </section>

      {/* POS Module Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface border border-line rounded-2xl w-fit" role="tablist">
        <button
          type="button"
          onClick={() => setActiveTab('checkout')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'checkout'
              ? 'bg-inverse text-ink-inverse shadow-xs'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>POS Register &amp; Sales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-inverse text-ink-inverse shadow-xs'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventory &amp; Bulk Breakdown</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-inverse text-ink-inverse shadow-xs'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sales &amp; Financial Reports</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backups')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'backups'
              ? 'bg-inverse text-ink-inverse shadow-xs'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Database &amp; Backups</span>
        </button>

        {posRole === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'bg-inverse text-ink-inverse shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Store Users &amp; Cashiers</span>
          </button>
        )}
      </div>

      {/* Role Notice Indicator */}
      {posRole === 'SHAREHOLDER' && (
        <div className="bg-canvas border border-line rounded-2xl p-4 flex items-center justify-between text-xs text-ink-secondary">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-brand" />
            <span>
              <strong>Shareholder Member Mode Active:</strong> You have a simple read-only interface. You can view prices per box, sack, piece, and kilogram, review sales reports, and inspect backups without modifying active registers.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPosRole('CASHIER')}
            className="text-brand font-bold hover:underline shrink-0 cursor-pointer"
          >
            Switch to Cashier
          </button>
        </div>
      )}

      {/* Active Tab View */}
      {activeTab === 'checkout' && (
        <PosCheckoutView
          products={products}
          userRole={posRole}
          activeUserName={currentUserName}
          onCompleteSale={handleCompleteSale}
          onOpenReceipt={(sale) => setSelectedReceipt(sale)}
          recentSales={sales}
        />
      )}

      {activeTab === 'inventory' && (
        <PosInventoryView
          products={products}
          userRole={posRole}
          onAddProduct={handleAddProduct}
          onBreakdownProduct={handleBreakdownProduct}
          onAdjustStock={handleAdjustStock}
        />
      )}

      {activeTab === 'reports' && (
        <PosReportsView
          sales={sales}
          products={products}
          userRole={posRole}
          onOpenReceipt={(sale) => setSelectedReceipt(sale)}
        />
      )}

      {activeTab === 'backups' && (
        <PosBackupsView
          products={products}
          sales={sales}
          backups={backups}
          userRole={posRole}
          activeUserName={currentUserName}
          onCreateSnapshot={handleCreateSnapshot}
          onRestoreSnapshot={handleRestoreSnapshot}
          onImportBackupJson={handleImportBackupJson}
          onResetFactoryData={handleResetFactoryData}
        />
      )}

      {activeTab === 'users' && posRole === 'ADMIN' && (
        platformState ? (
          <AdminUsersView
            state={platformState}
            currentAdminId={currentAdminId}
            userSearch={userSearch || localSearch}
            onChangeUserSearch={(s) => {
              setLocalSearch(s);
              onChangeUserSearch?.(s);
            }}
            onImpersonateUser={onImpersonateUser || (() => {})}
            onCreateUser={onCreateUser || (() => {})}
            onUpdateUserAdmin={onUpdateUserAdmin || (() => {})}
            onResetUserPin={onResetUserPin || (() => {})}
            isPosMode={true}
            initialRoleFilter={UserRole.CASHIER}
          />
        ) : (
          <div className="bg-surface border border-line rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-brand" />
              <div>
                <h3 className="font-display text-base font-bold text-ink">Cashier &amp; Staff Terminal Management</h3>
                <p className="text-xs text-ink-secondary">Standalone POS Terminal Administration</p>
              </div>
            </div>
            <p className="text-xs text-ink-secondary">
              Connect to full platform state to view live accounts or switch to Farmer Credit App.
            </p>
          </div>
        )
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-surface border border-line rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <p className="text-[10px] text-brand font-mono font-bold uppercase">Official Cooperative Receipt</p>
                <h3 className="font-mono text-base font-extrabold text-ink">{selectedReceipt.receiptNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-canvas cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 font-mono text-ink-secondary">
              <p>Date: {selectedReceipt.timestamp}</p>
              <p>Cashier: {selectedReceipt.cashierName}</p>
              <p>Customer: {selectedReceipt.customerName || selectedReceipt.customerType}</p>
              <p>Payment: {selectedReceipt.paymentMethod}</p>
            </div>

            <div className="border-t border-b border-line py-2.5 divide-y divide-line text-xs">
              {selectedReceipt.items.map((it, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-ink truncate">{it.name}</p>
                    <p className="text-[10px] text-ink-secondary font-mono">
                      {it.quantity} {it.unit} &times; {formatPHP(it.unitPrice)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-ink shrink-0">{formatPHP(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between font-bold text-sm text-ink">
                <span>Total Amount:</span>
                <span className="text-brand">{formatPHP(selectedReceipt.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Tendered:</span>
                <span>{formatPHP(selectedReceipt.amountTendered)}</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Change:</span>
                <span>{formatPHP(selectedReceipt.change)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-full min-h-[42px] rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
