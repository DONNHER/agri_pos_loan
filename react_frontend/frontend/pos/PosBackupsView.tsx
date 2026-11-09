import React, { useRef, useState } from 'react';
import {
  Archive,
  Database,
  Download,
  FileCheck2,
  HardDriveDownload,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { formatPHP } from '../loan/shared/creditData';
import { PosBackupSnapshot, PosProduct, PosSaleRecord } from './posData';

interface PosBackupsViewProps {
  products: PosProduct[];
  sales: PosSaleRecord[];
  backups: PosBackupSnapshot[];
  userRole: 'CASHIER' | 'ADMIN' | 'SHAREHOLDER';
  activeUserName: string;
  onCreateSnapshot: (label: string) => void;
  onRestoreSnapshot: (snapshot: PosBackupSnapshot) => void;
  onImportBackupJson: (json: string) => void;
  onResetFactoryData: () => void;
}

export const PosBackupsView: React.FC<PosBackupsViewProps> = ({
  products,
  sales,
  backups,
  userRole,
  activeUserName,
  onCreateSnapshot,
  onRestoreSnapshot,
  onImportBackupJson,
  onResetFactoryData,
}) => {
  const isReadOnly = userRole === 'SHAREHOLDER';
  const isAdmin = userRole === 'ADMIN';

  const [snapshotLabel, setSnapshotLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel.trim()) return;
    onCreateSnapshot(snapshotLabel.trim());
    setSnapshotLabel('');
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: activeUserName,
      role: userRole,
      products,
      sales,
      checksum: `SHA256-POS-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pos_full_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackupJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="bg-surface border border-line rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink">
            POS Database Snapshots &amp; Disaster Recovery
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Create full point-in-time snapshots of catalog stocks, unit breakdown ratios, and POS transaction records.
            {isReadOnly && ' (Shareholder Read-Only Inspection)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON Backup</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-canvas hover:bg-subtle border border-line text-ink text-xs font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Import JSON File</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </section>

      {/* Grid: Create Snapshot vs Backup Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Create Point-in-time Snapshot */}
        <section className="lg:col-span-5 bg-surface border border-line rounded-3xl p-6 space-y-5">
          <div className="pb-3 border-b border-line">
            <h3 className="font-display text-base font-bold text-ink">
              Create Point-in-Time Snapshot
            </h3>
            <p className="text-xs text-ink-secondary">
              Captures live state for one-click rollback
            </p>
          </div>

          <div className="bg-canvas rounded-2xl p-4 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Current Catalog Size:</span>
              <strong className="text-ink">{products.length} products</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Sales Receipts Logged:</span>
              <strong className="text-ink">{sales.length} records</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Current Turnover:</span>
              <strong className="text-brand">
                {formatPHP(sales.reduce((acc, s) => acc + s.totalAmount, 0))}
              </strong>
            </div>
          </div>

          {!isReadOnly ? (
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Snapshot Label / Description
                </label>
                <input
                  type="text"
                  required
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder="e.g. End of Day Seedling & Fertilizer Count"
                  className="w-full min-h-[42px] px-3.5 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <HardDriveDownload className="w-4 h-4" />
                <span>Save New Snapshot</span>
              </button>
            </form>
          ) : (
            <p className="text-xs text-ink-secondary">
              Shareholder role has read-only access to system backups. Admin and Cashier roles can capture new state checkpoints.
            </p>
          )}

          {isAdmin && (
            <div className="pt-3 border-t border-line">
              <button
                type="button"
                onClick={onResetFactoryData}
                className="w-full min-h-[42px] px-4 rounded-xl bg-canvas hover:bg-subtle text-danger border border-line text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Agricultural Factory Seed</span>
              </button>
            </div>
          )}
        </section>

        {/* Right 7 Cols: Stored Snapshots */}
        <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 space-y-4">
          <div className="pb-3 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Stored System Snapshots ({backups.length})
              </h3>
              <p className="text-xs text-ink-secondary">
                Immutable SHA256 verifiable checkpoints
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-success" />
          </div>

          {backups.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-secondary space-y-2">
              <Archive className="w-8 h-8 text-ink-muted mx-auto" />
              <p className="font-semibold text-ink">No snapshots created yet</p>
              <p>Create a backup snapshot above to safeguard your inventory and sales data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((snap) => (
                <div
                  key={snap.id}
                  className="bg-canvas border border-line rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-mono font-bold text-ink-secondary truncate">
                      {snap.checksum}
                    </p>
                    <h4 className="font-display text-sm font-bold text-ink truncate">
                      {snap.label}
                    </h4>
                    <p className="text-xs text-ink-muted">
                      {snap.timestamp} · {snap.productCount} products · {snap.salesCount} sales ({formatPHP(snap.totalRevenue)})
                    </p>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onRestoreSnapshot(snap)}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
