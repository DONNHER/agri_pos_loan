import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  PackagePlus,
  Plus,
  Search,
  Split,
} from 'lucide-react';
import { formatPHP } from '../loan/shared/creditData';
import { PosProduct, PosUnit } from './posData';

interface PosInventoryViewProps {
  products: PosProduct[];
  userRole: 'CASHIER' | 'ADMIN' | 'SHAREHOLDER';
  onAddProduct: (product: Omit<PosProduct, 'id'>) => void;
  onBreakdownProduct: (
    parentProductId: string,
    quantityToBreakdown: number
  ) => void;
  onAdjustStock: (productId: string, adjustment: number) => void;
}

export const PosInventoryView: React.FC<PosInventoryViewProps> = ({
  products,
  userRole,
  onAddProduct,
  onBreakdownProduct,
  onAdjustStock,
}) => {
  const isReadOnly = userRole === 'SHAREHOLDER';
  const canManage = userRole === 'ADMIN' || userRole === 'CASHIER';

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<'ALL' | PosUnit>('ALL');

  // Breakdown modal state
  const [breakdownModalProduct, setBreakdownModalProduct] = useState<PosProduct | null>(null);
  const [breakdownQty, setBreakdownQty] = useState<number>(1);

  // New Product Modal state
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<PosProduct['category']>('Fertilizers');
  const [newUnit, setNewUnit] = useState<PosUnit>('box');
  const [newStock, setNewStock] = useState<number>(10);
  const [newCost, setNewCost] = useState<number>(1200);
  const [newSelling, setNewSelling] = useState<number>(1500);
  const [newMinThreshold, setNewMinThreshold] = useState<number>(3);
  const [enableBreakdown, setEnableBreakdown] = useState(false);
  const [breakdownTargetUnit, setBreakdownTargetUnit] = useState<PosUnit>('piece');
  const [breakdownRatioInput, setBreakdownRatioInput] = useState<number>(20);

  const units: Array<'ALL' | PosUnit> = ['ALL', 'box', 'sack', 'piece', 'kg'];

  const filtered = products.filter((p) => {
    const matchesUnit = unitFilter === 'ALL' || p.unit === unitFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);
    return matchesUnit && matchesQuery;
  });

  const breakdownCandidates = products.filter((p) => p.canBreakDown);

  const handleOpenBreakdown = (product: PosProduct) => {
    setBreakdownModalProduct(product);
    setBreakdownQty(1);
  };

  const handleConfirmBreakdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdownModalProduct || breakdownQty <= 0) return;
    onBreakdownProduct(breakdownModalProduct.id, breakdownQty);
    setBreakdownModalProduct(null);
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) return;

    onAddProduct({
      sku: newSku.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory,
      unit: newUnit,
      stock: Math.max(0, newStock),
      costPrice: Math.max(0, newCost),
      sellingPrice: Math.max(0, newSelling),
      minThreshold: Math.max(1, newMinThreshold),
      canBreakDown: enableBreakdown,
      breakdownIntoUnit: enableBreakdown ? breakdownTargetUnit : undefined,
      breakdownRatio: enableBreakdown ? breakdownRatioInput : undefined,
    });

    setNewProductOpen(false);
    setNewSku('');
    setNewName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Actions */}
      <section className="bg-surface border border-line rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink">
            Agricultural Inventory &amp; Bulk Breakdown Desk
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Track multi-unit stocks: Boxes, Sacks, Pieces, and Kilograms with automated bulk packaging conversion.
            {isReadOnly && ' (Shareholder Read-Only View)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => setNewProductOpen(true)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </section>

      {/* Feature Showcase: Box -> Piece & Sack -> Kilogram Quick Breakdown Station */}
      <section className="bg-surface border border-line rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-brand" />
            <h3 className="font-display text-base font-bold text-ink">
              Bulk Breakdown Station (Boxes to Pieces · Sacks to Kilograms)
            </h3>
          </div>
          <span className="text-xs text-ink-secondary">
            {breakdownCandidates.length} convertible bulk items configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {breakdownCandidates.map((parent) => {
            const childProduct = products.find(
              (p) => p.id === parent.breakdownTargetProductId
            );
            return (
              <div
                key={parent.id}
                className="bg-canvas border border-line rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono tabular-nums text-ink-secondary">
                    <span>{parent.sku}</span>
                    <span className="font-bold text-brand uppercase">
                      1 {parent.unit} = {parent.breakdownRatio} {parent.breakdownIntoUnit}s
                    </span>
                  </div>
                  <p className="font-display text-sm font-bold text-ink mt-1 truncate">
                    {parent.name}
                  </p>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Current: <strong className="font-mono text-ink">{parent.stock} {parent.unit}s</strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
                  <div className="text-[11px] text-ink-secondary min-w-0">
                    <p className="truncate">Converts into:</p>
                    <p className="font-semibold text-ink truncate">
                      {childProduct?.name || `${parent.breakdownIntoUnit} retail`}
                    </p>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      disabled={parent.stock <= 0}
                      onClick={() => handleOpenBreakdown(parent)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-inverse hover:bg-inverse-hover disabled:opacity-40 text-ink-inverse text-xs font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Break Down</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Inventory Table with Filters */}
      <section className="bg-surface border border-line rounded-3xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div className="flex items-center gap-1.5 overflow-x-auto" role="tablist">
            {units.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnitFilter(u)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  unitFilter === u
                    ? 'bg-inverse text-ink-inverse shadow-xs'
                    : 'bg-canvas text-ink-secondary hover:text-ink'
                }`}
              >
                {u === 'ALL' ? 'All Units' : `Per ${u.toUpperCase()}`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU or name..."
              className="w-full min-h-[40px] pl-9 pr-3 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-ink-secondary font-semibold">
                <th className="pb-3 pl-1">SKU &amp; Product</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Unit</th>
                <th className="pb-3 text-right">In Stock</th>
                <th className="pb-3 text-right">Cost Price</th>
                <th className="pb-3 text-right">Selling Price</th>
                <th className="pb-3 text-center">Status</th>
                {!isReadOnly && <th className="pb-3 text-right pr-1">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((item) => {
                const isOut = item.stock <= 0;
                const isLow = item.stock > 0 && item.stock <= item.minThreshold;
                return (
                  <tr key={item.id} className="hover:bg-canvas transition-colors">
                    <td className="py-3 pl-1 min-w-[200px]">
                      <p className="font-bold text-ink">{item.name}</p>
                      <p className="font-mono text-[11px] text-ink-muted">{item.sku}</p>
                    </td>
                    <td className="py-3 text-ink-secondary whitespace-nowrap">{item.category}</td>
                    <td className="py-3 whitespace-nowrap">
                      <span className="uppercase px-2 py-0.5 rounded bg-subtle text-ink font-mono font-bold text-[10px]">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                      <span className={isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-ink'}>
                        {item.stock} {item.unit}s
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-ink-secondary whitespace-nowrap">
                      {formatPHP(item.costPrice)}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums font-bold text-brand whitespace-nowrap">
                      {formatPHP(item.sellingPrice)}
                    </td>
                    <td className="py-3 text-center whitespace-nowrap">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 text-danger font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Out of Stock</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 text-warning font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Low Stock (&le;{item.minThreshold})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-success font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Healthy</span>
                        </span>
                      )}
                    </td>
                    {!isReadOnly && (
                      <td className="py-3 text-right pr-1 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.canBreakDown && (
                            <button
                              type="button"
                              onClick={() => handleOpenBreakdown(item)}
                              disabled={item.stock <= 0}
                              className="px-2.5 py-1 rounded-lg bg-inverse hover:bg-inverse-hover text-ink-inverse text-[11px] font-semibold cursor-pointer disabled:opacity-30"
                            >
                              Convert
                            </button>
                          )}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => onAdjustStock(item.id, 5)}
                              className="px-2 py-1 rounded-lg bg-canvas hover:bg-subtle border border-line text-ink text-[11px] font-semibold cursor-pointer"
                            >
                              +5 Stock
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal 1: Breakdown Converter (e.g. 1 Box -> 20 Pieces or 1 Sack -> 50 kg) */}
      {breakdownModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Split className="w-5 h-5 text-brand" />
                <h3 className="font-display text-lg font-bold text-ink">
                  Bulk Product Breakdown Converter
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBreakdownModalProduct(null)}
                className="text-ink-secondary hover:text-ink text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleConfirmBreakdown} className="space-y-4">
              <div className="bg-canvas rounded-2xl p-4 space-y-2 text-xs">
                <p className="text-ink-secondary">Converting Bulk Parent:</p>
                <p className="font-bold text-ink text-sm">{breakdownModalProduct.name}</p>
                <p className="text-ink-secondary font-mono">
                  Current Stock: <strong>{breakdownModalProduct.stock} {breakdownModalProduct.unit}s</strong>
                </p>
                <div className="pt-2 border-t border-line text-brand font-bold">
                  Rule: 1 {breakdownModalProduct.unit} &rarr; {breakdownModalProduct.breakdownRatio} {breakdownModalProduct.breakdownIntoUnit}s
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Quantity of {breakdownModalProduct.unit}s to unpack &amp; convert:
                </label>
                <input
                  type="number"
                  min={1}
                  max={breakdownModalProduct.stock}
                  value={breakdownQty}
                  onChange={(e) => setBreakdownQty(Number(e.target.value) || 1)}
                  className="w-full min-h-[44px] px-3.5 bg-canvas border border-line rounded-xl font-mono text-base font-bold text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="bg-subtle rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-ink-secondary">
                  <span>Parent stock deduction:</span>
                  <span className="font-mono font-bold text-danger">-{breakdownQty} {breakdownModalProduct.unit}s</span>
                </div>
                <div className="flex justify-between text-ink-secondary">
                  <span>Retail stock yield added:</span>
                  <span className="font-mono font-bold text-success">
                    +{(breakdownQty * (breakdownModalProduct.breakdownRatio || 1))} {breakdownModalProduct.breakdownIntoUnit}s
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBreakdownModalProduct(null)}
                  className="min-h-[40px] px-4 rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold cursor-pointer"
                >
                  Confirm &amp; Convert Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Multi-Unit Product */}
      {newProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-surface border border-line rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-brand" />
                <h3 className="font-display text-lg font-bold text-ink">
                  Add Multi-Unit Product
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewProductOpen(false)}
                className="text-ink-secondary hover:text-ink text-sm cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-secondary font-medium mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="e.g. AGR-BOX-09"
                    className="w-full min-h-[40px] px-3 bg-canvas border border-line rounded-xl font-mono text-ink uppercase"
                  />
                </div>
                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as PosProduct['category'])}
                    className="w-full min-h-[40px] px-3 bg-canvas border border-line rounded-xl text-ink"
                  >
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Seeds & Grains">Seeds &amp; Grains</option>
                    <option value="Agri-Chemicals">Agri-Chemicals</option>
                    <option value="Farm Tools">Farm Tools</option>
                    <option value="Feeds & Supplements">Feeds &amp; Supplements</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-ink-secondary font-medium mb-1">Product Description</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Superphosphate Root Enhancer"
                  className="w-full min-h-[40px] px-3 bg-canvas border border-line rounded-xl text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Unit of Measure</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as PosUnit)}
                    className="w-full min-h-[40px] px-3 bg-canvas border border-line rounded-xl text-ink uppercase font-bold"
                  >
                    <option value="box">Box</option>
                    <option value="sack">Sack</option>
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram (kg)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value) || 0)}
                    className="w-full min-h-[40px] px-3 bg-canvas border border-line rounded-xl font-mono text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Cost (PHP)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value) || 0)}
                    className="w-full min-h-[40px] px-3 bg-canvas border border-line rounded-xl font-mono text-ink"
                  />
                </div>
                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Selling (PHP)</label>
                  <input
                    type="number"
                    min={0}
                    value={newSelling}
                    onChange={(e) => setNewSelling(Number(e.target.value) || 0)}
                    className="w-full min-h-[40px] px-3 bg-canvas border border-line rounded-xl font-mono font-bold text-brand"
                  />
                </div>
                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Low Alert Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={newMinThreshold}
                    onChange={(e) => setNewMinThreshold(Number(e.target.value) || 1)}
                    className="w-full min-h-[40px] px-3 bg-canvas border border-line rounded-xl font-mono text-ink"
                  />
                </div>
              </div>

              {/* Bulk Breakdown Config Checkbox */}
              {(newUnit === 'box' || newUnit === 'sack') && (
                <div className="p-3 bg-canvas border border-line rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableBreakdown}
                      onChange={(e) => setEnableBreakdown(e.target.checked)}
                      className="accent-brand rounded"
                    />
                    <span className="font-semibold text-ink">
                      Enable bulk breakdown feature for this {newUnit}
                    </span>
                  </label>

                  {enableBreakdown && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
                      <div>
                        <label className="block text-[11px] text-ink-secondary mb-1">Target Retail Unit</label>
                        <select
                          value={breakdownTargetUnit}
                          onChange={(e) => setBreakdownTargetUnit(e.target.value as PosUnit)}
                          className="w-full min-h-[36px] px-2.5 bg-surface border border-line rounded-lg text-ink"
                        >
                          <option value="piece">Per Piece</option>
                          <option value="kg">Per Kilogram (kg)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-ink-secondary mb-1">Units per {newUnit}</label>
                        <input
                          type="number"
                          min={1}
                          value={breakdownRatioInput}
                          onChange={(e) => setBreakdownRatioInput(Number(e.target.value) || 1)}
                          className="w-full min-h-[36px] px-2.5 bg-surface border border-line rounded-lg font-mono text-ink"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setNewProductOpen(false)}
                  className="min-h-[40px] px-4 rounded-xl text-ink-secondary hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-on-brand font-semibold cursor-pointer"
                >
                  Save Product to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
