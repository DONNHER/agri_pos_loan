import React, { useState } from 'react';
import {
  Database,
  Download,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Upload,
  UserCheck,
} from 'lucide-react';
import {
  AuditCategory,
  BackupSnapshot,
  formatPHP,
  getRoleLabel,
  PlatformState,
} from '../shared/creditData';

interface AdminLogsBackupsViewProps {
  state: PlatformState;
  opsSubView: 'logs' | 'backups';
  focusedBackupChecksum?: string;
  onChangeOpsSubView: (view: 'logs' | 'backups') => void;
  onClearFocusedBackup: () => void;
  onCreateBackupSnapshot: (label: string) => void;
  onRestoreBackupSnapshot: (snapshot: BackupSnapshot) => void;
  onImportJsonBackup: (jsonContent: string) => void;
  onResetFactorySeed: () => void;
}

export const AdminLogsBackupsView: React.FC<AdminLogsBackupsViewProps> = ({
  state,
  opsSubView,
  focusedBackupChecksum,
  onChangeOpsSubView,
  onClearFocusedBackup,
  onCreateBackupSnapshot,
  onRestoreBackupSnapshot,
  onImportJsonBackup,
  onResetFactorySeed,
}) => {
  const [logCategory, setLogCategory] = useState<'ALL' | AuditCategory>('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [backupLabel, setBackupLabel] = useState(
    'Monthly Statement Cycle Checkpoint'
  );

  const handleDownloadJsonBackup = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'TikCredit Revolving Credit System',
      data: {
        ...state,
        backups: [],
      },
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tikcredit_backup_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportJsonBackup(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const lq = logSearch.trim().toLowerCase();
  const filteredLogs = state.auditLogs.filter((log) => {
    if (logCategory !== 'ALL' && log.category !== logCategory) return false;
    if (!lq) return true;
    return (
      log.action.toLowerCase().includes(lq) ||
      log.actorName.toLowerCase().includes(lq) ||
      log.details.toLowerCase().includes(lq) ||
      log.target.toLowerCase().includes(lq)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-surface border border-line rounded-xl">
          <button
            type="button"
            onClick={() => onChangeOpsSubView('logs')}
            className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
              opsSubView === 'logs'
                ? 'bg-inverse text-ink-inverse'
                : 'text-ink-secondary'
            }`}
          >
            Audit Logs ({state.auditLogs.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeOpsSubView('backups')}
            className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
              opsSubView === 'backups'
                ? 'bg-inverse text-ink-inverse'
                : 'text-ink-secondary'
            }`}
          >
            Backups &amp; Recovery ({state.backups.length})
          </button>
        </div>
      </div>

      {opsSubView === 'logs' ? (
        <section className="bg-surface border border-line rounded-3xl p-5 sm:p-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  'ALL',
                  'AUTH',
                  'IMPERSONATION',
                  'ONBOARDING',
                  'LOAN',
                  'PAYMENT',
                  'TICKET',
                  'USER_MGMT',
                  'BACKUP',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setLogCategory(cat)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                    logCategory === cat
                      ? 'bg-inverse text-ink-inverse'
                      : 'bg-canvas text-ink-secondary hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter action, actor, ref..."
                className="w-full min-h-[40px] pl-9 pr-3 bg-canvas border border-line rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="divide-y divide-line">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
                    <span className="font-bold text-ink">{log.action}</span>
                    <span className="text-ink-muted">·</span>
                    <span className="text-brand font-semibold">
                      {log.category}
                    </span>
                    <span className="text-ink-muted">·</span>
                    <span className="text-ink-secondary">
                      Target: {log.target}
                    </span>
                    {log.impersonatedBy && (
                      <span className="inline-flex items-center gap-1 text-warning font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Impersonated by {log.impersonatedBy}
                      </span>
                    )}
                  </div>
                  <p className="text-ink">{log.details}</p>
                  <p className="text-[11px] text-ink-secondary">
                    Actor: {log.actorName} ({log.actorHandle} ·{' '}
                    {getRoleLabel(log.actorRole)})
                  </p>
                </div>
                <span className="font-mono tabular-nums text-[11px] text-ink-muted whitespace-nowrap shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-5 bg-surface border border-line rounded-3xl p-6 space-y-5">
            <div className="pb-3 border-b border-line">
              <h2 className="font-display text-lg font-bold text-ink">
                Create Snapshot or Export JSON
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Preserve full platform user balances, loans, notifications, tickets, and logs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                Snapshot Label
              </label>
              <input
                type="text"
                value={backupLabel}
                onChange={(e) => setBackupLabel(e.target.value)}
                placeholder="e.g. Monthly Statement Closing Backup"
                className="w-full min-h-[46px] px-3.5 bg-canvas border border-line rounded-xl text-sm text-ink"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                onCreateBackupSnapshot(
                  backupLabel.trim() || 'Manual Admin Snapshot'
                );
                setBackupLabel('');
              }}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create In-App Snapshot Backup</span>
            </button>

            <div className="pt-4 border-t border-line space-y-2.5">
              <button
                type="button"
                onClick={handleDownloadJsonBackup}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Full JSON Backup (.json)</span>
              </button>

              <label className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-canvas hover:bg-subtle border border-line text-ink text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import &amp; Restore JSON Backup File</span>
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileUploadBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={onResetFactorySeed}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-brand-soft hover:bg-brand-tint text-danger text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Platform to Factory Seed</span>
              </button>
            </div>
          </section>

          <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
              <h2 className="font-display text-lg font-bold text-ink">
                Saved Point-in-Time Snapshots ({state.backups.length})
              </h2>
              {focusedBackupChecksum && (
                <button
                  type="button"
                  onClick={onClearFocusedBackup}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-canvas hover:bg-subtle text-xs font-semibold text-ink cursor-pointer"
                >
                  Focused: {focusedBackupChecksum} · Clear
                </button>
              )}
            </div>

            <div className="space-y-3">
              {state.backups.map((bkp) => {
                const isFocused = focusedBackupChecksum === bkp.checksum;
                return (
                  <div
                    key={bkp.id}
                    className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isFocused ? 'bg-surface border border-ink' : 'bg-canvas'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-ink-secondary">
                        <Database className="w-3.5 h-3.5 text-ink" />
                        <span>{bkp.checksum}</span>
                        <span>·</span>
                        <span>{bkp.createdAt}</span>
                      </div>
                      <p className="text-sm font-bold text-ink truncate">
                        {bkp.label}
                      </p>
                      <p className="text-xs text-ink-secondary font-mono tabular-nums">
                        {bkp.usersCount} users · {bkp.loansCount} loan requests ·{' '}
                        {bkp.ticketsCount} tickets ·{' '}
                        {formatPHP(bkp.totalVolumePHP)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRestoreBackupSnapshot(bkp)}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-surface hover:bg-subtle border border-line text-ink text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-success" />
                      <span>Restore Snapshot</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
