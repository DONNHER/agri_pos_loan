import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  CreditCard,
  Download,
  Filter,
  PieChart,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { formatPHP } from '../loan/shared/creditData';
import { PosProduct, PosSaleRecord } from './posData';

interface PosReportsViewProps {
  sales: PosSaleRecord[];
  products: PosProduct[];
  userRole: 'CASHIER' | 'ADMIN' | 'SHAREHOLDER';
  onOpenReceipt: (sale: PosSaleRecord) => void;
}

export const PosReportsView: React.FC<PosReportsViewProps> = ({
  sales,
  products,
  userRole,
  onOpenReceipt,
}) => {
  const [filterPayment, setFilterPayment] = useState<string>('ALL');

  const filteredSales = sales.filter(
    (s) => filterPayment === 'ALL' || s.paymentMethod === filterPayment
  );

  const totalGrossRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalTransactions = sales.length;
  const avgOrderValue = totalTransactions > 0 ? totalGrossRevenue / totalTransactions : 0;

  const totalInventoryUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryAssetValue = products.reduce(
    (acc, p) => acc + p.stock * p.costPrice,
    0
  );

  const paymentBreakdown = sales.reduce((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const handleExportCsv = () => {
    const headers = [
      'Receipt Number',
      'Timestamp',
      'Cashier',
      'Customer',
      'Customer Type',
      'Payment Method',
      'Total Amount (PHP)',
      'Items Count',
    ];
    const rows = sales.map((s) => [
      s.receiptNumber,
      `"${s.timestamp}"`,
      `"${s.cashierName}"`,
      `"${s.customerName || 'N/A'}"`,
      `"${s.customerType}"`,
      s.paymentMethod,
      s.totalAmount.toFixed(2),
      s.items.length,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pos_sales_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Financial Strip */}
      <section className="bg-surface border border-line rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink">
            Agricultural POS Sales &amp; Financial Reports
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Real-time turnover, customer settlements, and cooperative inventory asset valuation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Sales CSV</span>
        </button>
      </section>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-line rounded-2xl p-5 space-y-1">
          <p className="text-xs text-ink-secondary">Gross POS Revenue</p>
          <p className="font-mono tabular-nums text-2xl font-extrabold text-brand">
            {formatPHP(totalGrossRevenue)}
          </p>
          <p className="text-[11px] text-ink-muted">{totalTransactions} orders completed</p>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 space-y-1">
          <p className="text-xs text-ink-secondary">Average Ticket Value</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-ink">
            {formatPHP(avgOrderValue)}
          </p>
          <p className="text-[11px] text-ink-muted">Per cooperative receipt</p>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 space-y-1">
          <p className="text-xs text-ink-secondary">Total Inventory Stock</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-ink">
            {totalInventoryUnits} units
          </p>
          <p className="text-[11px] text-ink-muted">Across boxes, sacks, kg &amp; pcs</p>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 space-y-1">
          <p className="text-xs text-ink-secondary">Inventory Valuation</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-accent">
            {formatPHP(totalInventoryAssetValue)}
          </p>
          <p className="text-[11px] text-ink-muted">Warehouse cost basis</p>
        </div>
      </div>

      {/* Two-Column Analytics: Payment Method Breakdown vs Sales Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Cols: Payment Channel Mix */}
        <section className="lg:col-span-4 bg-surface border border-line rounded-3xl p-6 space-y-4">
          <div className="pb-3 border-b border-line">
            <h3 className="font-display text-base font-bold text-ink">
              Payment Method Breakdown
            </h3>
            <p className="text-xs text-ink-secondary">
              Cash, Member Credit Lines, and Digital Wallets
            </p>
          </div>

          <div className="space-y-2.5">
            {Object.entries(paymentBreakdown).map(([method, amount]) => {
              const pct = totalGrossRevenue > 0 ? (amount / totalGrossRevenue) * 100 : 0;
              return (
                <div key={method} className="bg-canvas rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">{method}</span>
                    <span className="font-mono tabular-nums font-bold text-ink">
                      {formatPHP(amount)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-ink-secondary text-right font-mono">
                    {pct.toFixed(1)}% of total volume
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right 8 Cols: Sales Ledger History */}
        <section className="lg:col-span-8 bg-surface border border-line rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Sales Ledger History ({filteredSales.length})
              </h3>
              <p className="text-xs text-ink-secondary">Click any receipt to view full line-item details</p>
            </div>

            <div className="flex items-center gap-1 bg-subtle rounded-xl p-1 text-xs self-start">
              {['ALL', 'Cash', 'Shareholder Credit Line', 'GCash'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilterPayment(m)}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                    filterPayment === m
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  {m === 'Shareholder Credit Line' ? 'Credit Line' : m}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-line">
            {filteredSales.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onOpenReceipt(s)}
                className="w-full py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-canvas -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary font-mono">
                    <span className="font-bold text-ink">{s.receiptNumber}</span>
                    <span>·</span>
                    <span>{s.timestamp}</span>
                    <span>·</span>
                    <span className="text-brand font-semibold">{s.paymentMethod}</span>
                  </div>
                  <p className="text-sm font-semibold text-ink truncate">
                    {s.customerName || s.customerType}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {s.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-mono tabular-nums text-base font-extrabold text-brand">
                    {formatPHP(s.totalAmount)}
                  </span>
                  <Receipt className="w-4 h-4 text-ink-muted" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
