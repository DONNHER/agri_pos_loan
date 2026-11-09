import React, { useState } from 'react';
import {
  Boxes,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { formatPHP } from '../loan/shared/creditData';
import { PosCartItem, PosProduct, PosSaleRecord } from './posData';

interface PosCheckoutViewProps {
  products: PosProduct[];
  userRole: 'CASHIER' | 'ADMIN' | 'SHAREHOLDER';
  activeUserName: string;
  onCompleteSale: (sale: Omit<PosSaleRecord, 'id' | 'receiptNumber' | 'timestamp'>) => void;
  onOpenReceipt: (sale: PosSaleRecord) => void;
  recentSales: PosSaleRecord[];
}

export const PosCheckoutView: React.FC<PosCheckoutViewProps> = ({
  products,
  userRole,
  activeUserName,
  onCompleteSale,
  onOpenReceipt,
  recentSales,
}) => {
  const isReadOnly = userRole === 'SHAREHOLDER';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerType, setCustomerType] = useState<
    'Shareholder Member' | 'Walk-In Farmer' | 'Wholesale Buyer'
  >('Shareholder Member');
  const [customerName, setCustomerName] = useState('Eduardo Ramos (Shareholder)');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash' | 'Maya' | 'Shareholder Credit Line'>('Cash');
  const [amountTenderedInput, setAmountTenderedInput] = useState<string>('');

  const categories = [
    'ALL',
    'Fertilizers',
    'Seeds & Grains',
    'Agri-Chemicals',
    'Farm Tools',
    'Feeds & Supplements',
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.unit.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const tenderedAmount = Number(amountTenderedInput) || cartTotal;
  const changeDue = Math.max(0, tenderedAmount - cartTotal);

  const handleAddToCart = (product: PosProduct) => {
    if (isReadOnly || product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.product.sellingPrice,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          subtotal: product.sellingPrice,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    if (isReadOnly) return;
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const nextQty = i.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > i.product.stock) return i;
          return {
            ...i,
            quantity: nextQty,
            subtotal: nextQty * i.product.sellingPrice,
          };
        })
        .filter((item): item is PosCartItem => item !== null)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    if (isReadOnly) return;
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setAmountTenderedInput('');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || cart.length === 0) return;
    if (tenderedAmount < cartTotal && paymentMethod === 'Cash') {
      alert('Tendered cash is less than cart total.');
      return;
    }

    onCompleteSale({
      cashierName: activeUserName,
      cashierRole: userRole,
      customerName: customerName.trim() || undefined,
      customerType,
      items: cart.map((c) => ({
        productId: c.product.id,
        sku: c.product.sku,
        name: c.product.name,
        unit: c.product.unit,
        unitPrice: c.product.sellingPrice,
        quantity: c.quantity,
        subtotal: c.subtotal,
      })),
      totalAmount: cartTotal,
      amountTendered: paymentMethod === 'Cash' ? tenderedAmount : cartTotal,
      change: paymentMethod === 'Cash' ? changeDue : 0,
      paymentMethod,
    });

    handleClearCart();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7/8 Cols: Product Catalog & Fast Search */}
      <section className="lg:col-span-7 xl:col-span-8 bg-surface border border-line rounded-3xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">
              Agricultural Trading Catalog
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Select items per Box, Sack, Piece, or Kilogram
              {isReadOnly && ' · (Shareholder Read-Only Price Monitor)'}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, name, unit..."
              className="w-full min-h-[42px] pl-9 pr-3 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-inverse text-ink-inverse shadow-xs'
                  : 'bg-canvas text-ink-secondary hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= p.minThreshold;
            const inCart = cart.find((i) => i.product.id === p.id);
            return (
              <div
                key={p.id}
                className="bg-canvas border border-line rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-ink-secondary font-mono tabular-nums">
                    <span>{p.sku}</span>
                    <span className="uppercase px-2 py-0.5 rounded bg-subtle text-ink font-bold text-[10px]">
                      {p.unit}
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink mt-1.5 leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-ink-secondary mt-0.5">{p.category}</p>
                </div>

                <div className="pt-2 border-t border-line space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] text-ink-muted">Selling Price</p>
                      <p className="font-mono tabular-nums text-base font-extrabold text-brand">
                        {formatPHP(p.sellingPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-ink-muted">In Stock</p>
                      <p
                        className={`font-mono tabular-nums text-xs font-bold ${
                          isOutOfStock
                            ? 'text-danger'
                            : isLowStock
                            ? 'text-warning'
                            : 'text-ink'
                        }`}
                      >
                        {p.stock} {p.unit}s
                      </p>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(p)}
                      className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isOutOfStock
                          ? 'bg-subtle text-ink-muted cursor-not-allowed'
                          : inCart
                          ? 'bg-brand text-on-brand'
                          : 'bg-inverse hover:bg-inverse-hover text-ink-inverse'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Right 5/4 Cols: POS Register / Cart / Fast Tender */}
      <section className="lg:col-span-5 xl:col-span-4 bg-surface border border-line rounded-3xl p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-line">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {isReadOnly ? 'Cart Summary Monitor' : 'POS Cashier Register'}
            </h2>
            <p className="text-xs text-ink-secondary">
              Operator: {activeUserName} ({userRole})
            </p>
          </div>
          {cart.length > 0 && !isReadOnly && (
            <button
              type="button"
              onClick={handleClearCart}
              className="text-xs text-danger hover:underline cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-secondary space-y-2">
            <Boxes className="w-8 h-8 text-ink-muted mx-auto" />
            <p className="font-semibold text-ink">Register is empty</p>
            <p className="max-w-xs mx-auto">
              {isReadOnly
                ? 'Shareholders can browse pricing and stock availability above.'
                : 'Click items from the catalog on the left to add boxes, sacks, pieces, or kilograms to the cart.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            {/* Cart Line Items */}
            <div className="max-h-60 overflow-y-auto divide-y divide-line pr-1 space-y-1">
              {cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink truncate">{item.product.name}</p>
                    <p className="text-[11px] text-ink-secondary font-mono tabular-nums">
                      {formatPHP(item.product.sellingPrice)} / {item.product.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isReadOnly ? (
                      <div className="flex items-center gap-1 bg-canvas border border-line rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-ink-secondary hover:text-ink cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono tabular-nums text-xs font-bold text-ink w-7 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity >= item.product.stock}
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-ink-secondary hover:text-ink disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono tabular-nums text-xs font-bold text-ink">
                        Qty: {item.quantity}
                      </span>
                    )}

                    <span className="font-mono tabular-nums text-xs font-extrabold text-ink w-16 text-right">
                      {formatPHP(item.subtotal)}
                    </span>

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="text-ink-muted hover:text-danger p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Customer & Settlement Options */}
            {!isReadOnly && (
              <div className="pt-3 border-t border-line space-y-3 text-xs">
                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Customer Type</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Shareholder Member', 'Walk-In Farmer', 'Wholesale Buyer'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCustomerType(t)}
                        className={`min-h-[34px] px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          customerType === t
                            ? 'bg-inverse text-ink-inverse'
                            : 'bg-canvas text-ink-secondary hover:text-ink'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Customer Name / Member ID</label>
                  <div className="flex items-center bg-canvas border border-line rounded-xl px-3">
                    <User className="w-3.5 h-3.5 text-ink-muted mr-2 shrink-0" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Juan dela Cruz (SH-8849)"
                      className="w-full min-h-[38px] bg-transparent text-xs text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Settlement Method</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Cash', 'Shareholder Credit Line', 'GCash', 'Maya'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-inverse text-ink-inverse'
                            : 'bg-canvas text-ink-secondary hover:text-ink'
                        }`}
                      >
                        <Wallet className="w-3 h-3" />
                        <span className="truncate">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'Cash' && (
                  <div>
                    <label className="block text-ink-secondary font-medium mb-1">Cash Tendered (PHP)</label>
                    <input
                      type="number"
                      step={10}
                      min={cartTotal}
                      value={amountTenderedInput}
                      onChange={(e) => setAmountTenderedInput(e.target.value)}
                      placeholder={String(cartTotal)}
                      className="w-full min-h-[40px] px-3 bg-canvas border border-line rounded-xl font-mono tabular-nums text-sm font-bold text-ink focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Calculations & Submit */}
            <div className="pt-3 border-t border-line space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Items in Cart:</span>
                <span className="font-mono tabular-nums font-semibold text-ink">
                  {cart.reduce((acc, i) => acc + i.quantity, 0)} units
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink font-bold text-sm">Total Payable:</span>
                <span className="font-mono tabular-nums font-extrabold text-xl text-brand">
                  {formatPHP(cartTotal)}
                </span>
              </div>
              {paymentMethod === 'Cash' && !isReadOnly && (
                <div className="flex items-center justify-between text-ink-secondary">
                  <span>Change Due:</span>
                  <span className="font-mono tabular-nums font-bold text-success">
                    {formatPHP(changeDue)}
                  </span>
                </div>
              )}
            </div>

            {!isReadOnly && (
              <button
                type="submit"
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Receipt className="w-4 h-4" />
                <span>Process Sale &amp; Print Receipt ({formatPHP(cartTotal)})</span>
              </button>
            )}
          </form>
        )}

        {/* Recent Transactions Peek */}
        <div className="pt-3 border-t border-line">
          <p className="text-xs font-semibold text-ink mb-2">Recent POS Receipts</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {recentSales.slice(0, 3).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onOpenReceipt(s)}
                className="w-full p-2.5 rounded-xl bg-canvas hover:bg-subtle text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="font-mono font-bold text-ink truncate">{s.receiptNumber}</p>
                  <p className="text-[11px] text-ink-secondary truncate">{s.customerName || s.customerType}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-brand">{formatPHP(s.totalAmount)}</p>
                  <p className="text-[10px] text-ink-muted">{s.paymentMethod}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
