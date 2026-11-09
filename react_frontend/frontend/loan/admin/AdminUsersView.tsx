import React, { useState } from 'react';
import { Edit3, Eye, Search, UserPlus, X } from 'lucide-react';
import {
  formatPHP,
  getRoleLabel,
  PlatformState,
  PlatformUser,
  UserRole,
} from '../shared/creditData';
import { SafeImage } from '../shared/components/SafeImage';

interface AdminUsersViewProps {
  state: PlatformState;
  currentAdminId: string;
  userSearch: string;
  onChangeUserSearch: (search: string) => void;
  onImpersonateUser: (targetUserId: string) => void;
  onCreateUser: (payload: {
    fullName: string;
    handle: string;
    email: string;
    phone: string;
    role: UserRole;
    totalLimit: number;
    shareCapital: number;
  }) => void;
  onUpdateUserAdmin: (
    userId: string,
    updates: {
      role: UserRole;
      status: 'ACTIVE' | 'SUSPENDED';
      totalLimit: number;
      shareCapital: number;
      kycVerified: boolean;
    }
  ) => void;
  onResetUserPin: (userId: string) => void;
  isPosMode?: boolean;
  initialRoleFilter?: 'ALL' | UserRole;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  state,
  currentAdminId,
  userSearch,
  onChangeUserSearch,
  onImpersonateUser,
  onCreateUser,
  onUpdateUserAdmin,
  onResetUserPin,
  isPosMode = false,
  initialRoleFilter,
}) => {
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>(
    initialRoleFilter || (isPosMode ? UserRole.CASHIER : 'ALL')
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);

  const [newFullName, setNewFullName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+63 917 610 4421');
  const [newRole, setNewRole] = useState<UserRole>(
    isPosMode ? UserRole.CASHIER : UserRole.SHAREHOLDER
  );
  const [newLimit, setNewLimit] = useState(40000);
  const [newShareCap, setNewShareCap] = useState(15000);

  const [editRole, setEditRole] = useState<UserRole>(UserRole.SHAREHOLDER);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editLimit, setEditLimit] = useState(50000);
  const [editShare, setEditShare] = useState(15000);
  const [editKyc, setEditKyc] = useState(true);

  const openEditModal = (u: PlatformUser) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditLimit(u.totalLimit);
    setEditShare(u.shareCapital);
    setEditKyc(u.kycVerified);
  };

  const q = userSearch.trim().toLowerCase();
  const filteredUsers = state.users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.accountId.toLowerCase().includes(q)
    );
  });

  const totalShareCapitalPool = state.users.reduce(
    (acc, u) => acc + u.shareCapital,
    0
  );

  return (
    <div className="space-y-6">
      <section className="bg-inverse text-ink-inverse rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-ink-inverse-muted">
              System Governance · Identity &amp; Access Control
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-inverse mt-1">
              User Management &amp; Session Impersonation
            </h1>
            <p className="text-xs text-ink-inverse-subtle mt-1">
              Provision accounts, adjust Shareholder credit limits, or impersonate any Shareholder or Manager session with full audit logging.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Platform User</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-ink-inverse/10">
          <div>
            <p className="text-xs text-ink-inverse-muted">Total Accounts</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-ink-inverse mt-0.5">
              {state.users.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Store Cashiers</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-brand mt-0.5">
              {state.users.filter((u) => u.role === UserRole.CASHIER).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Shareholder Borrowers</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-accent mt-0.5">
              {state.users.filter((u) => u.role === UserRole.SHAREHOLDER).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Share Capital Pool</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-ink-inverse mt-0.5">
              {formatPHP(totalShareCapitalPool)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Recorded Audit Events</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-ink-inverse mt-0.5">
              {state.auditLogs.length}
            </p>
          </div>
        </div>
      </section>

      {isPosMode && (
        <div className="bg-brand-soft border border-brand/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse shrink-0" />
            <div>
              <p className="font-bold text-brand">
                Agri-Trading Store POS · Cashier &amp; Terminal Staff View
              </p>
              <p className="text-ink-secondary">
                Configuring counter cashiers, terminal PINs, and cashier accounts for checkout stations.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-surface rounded-lg font-mono font-bold text-brand border border-brand/20 self-start sm:self-auto">
            {state.users.filter((u) => u.role === UserRole.CASHIER).length} Active Cashiers
          </span>
        </div>
      )}

      <section className="bg-surface border border-line rounded-3xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-subtle rounded-xl self-start">
            {(
              [
                { id: 'ALL', label: 'All Roles' },
                { id: UserRole.CASHIER, label: 'Cashiers' },
                { id: UserRole.SHAREHOLDER, label: 'Shareholders' },
                { id: UserRole.MANAGER, label: 'Managers' },
                { id: UserRole.ADMIN, label: 'Admins' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={userSearch}
              onChange={(e) => onChangeUserSearch(e.target.value)}
              placeholder="Search name, @handle, email, ID..."
              className="w-full min-h-[42px] pl-9 pr-3 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
            />
          </div>
        </div>

        <div className="divide-y divide-line">
          {filteredUsers.map((u) => {
            const isSelf = u.id === currentAdminId;
            const initials = u.fullName
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={u.id}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <SafeImage
                    src={u.avatarPath}
                    alt={u.fullName}
                    fallbackText={initials}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-sm text-ink">
                        {u.fullName}
                      </span>
                      <span className="text-ink-secondary">{u.handle}</span>
                      <span aria-hidden="true" className="text-ink-muted">
                        ·
                      </span>
                      <span className="font-semibold text-brand">
                        {getRoleLabel(u.role)}
                      </span>
                      <span aria-hidden="true" className="text-ink-muted">
                        ·
                      </span>
                      <span
                        className={`font-semibold ${
                          u.status === 'ACTIVE' ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary font-mono tabular-nums truncate mt-0.5">
                      {u.accountId} · {u.email} · {u.phone}
                      {u.role === UserRole.SHAREHOLDER
                        ? ` · Limit ${formatPHP(u.totalLimit)} · Share ${formatPHP(
                            u.shareCapital
                          )}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!isSelf && u.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => onImpersonateUser(u.id)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-accent" />
                      <span>Impersonate</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(u)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-canvas hover:bg-subtle text-xs font-semibold text-ink inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onResetUserPin(u.id)}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-canvas hover:bg-subtle text-xs font-medium text-ink-secondary hover:text-ink whitespace-nowrap cursor-pointer"
                  >
                    Reset PIN
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newFullName.trim()) return;
              const cleanHandle = newHandle.trim()
                ? newHandle.trim().startsWith('@')
                  ? newHandle.trim()
                  : `@${newHandle.trim()}`
                : `@${newFullName
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '')
                    .slice(0, 10)}`;
              onCreateUser({
                fullName: newFullName.trim(),
                handle: cleanHandle,
                email:
                  newEmail.trim() || `${cleanHandle.slice(1)}@tikcredit.ph`,
                phone: newPhone.trim(),
                role: newRole,
                totalLimit: newRole === UserRole.SHAREHOLDER ? newLimit : 0,
                shareCapital:
                  newRole === UserRole.SHAREHOLDER ? newShareCap : 0,
              });
              setNewFullName('');
              setNewHandle('');
              setNewEmail('');
              setCreateModalOpen(false);
            }}
            className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h2 className="font-display text-base font-bold text-ink">
                Provision Platform Account
              </h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-ink-secondary mb-1.5">
                Role
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  UserRole.CASHIER,
                  UserRole.SHAREHOLDER,
                  UserRole.MANAGER,
                  UserRole.ADMIN,
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewRole(r)}
                    className={`min-h-[40px] rounded-xl text-xs font-semibold cursor-pointer ${
                      newRole === r
                        ? 'bg-inverse text-ink-inverse'
                        : 'bg-canvas text-ink-secondary'
                    }`}
                  >
                    {r === UserRole.CASHIER
                      ? 'Cashier'
                      : r === UserRole.SHAREHOLDER
                      ? 'Shareholder'
                      : r === UserRole.MANAGER
                      ? 'Manager'
                      : 'Admin'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="e.g. Carlo Mendoza"
                className="w-full min-h-[44px] px-3.5 bg-canvas border border-line rounded-xl text-sm text-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  Handle
                </label>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="@carlo"
                  className="w-full min-h-[44px] px-3.5 bg-canvas border border-line rounded-xl text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="carlo@tikcredit.ph"
                  className="w-full min-h-[44px] px-3.5 bg-canvas border border-line rounded-xl text-sm text-ink"
                />
              </div>
            </div>

            {newRole === UserRole.SHAREHOLDER && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">
                    Credit Limit (PHP)
                  </label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(Number(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3.5 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">
                    Share Capital (PHP)
                  </label>
                  <input
                    type="number"
                    value={newShareCap}
                    onChange={(e) =>
                      setNewShareCap(Number(e.target.value) || 0)
                    }
                    className="w-full min-h-[44px] px-3.5 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-sm font-semibold cursor-pointer"
            >
              Create User Account
            </button>
          </form>
        </div>
      )}

      {editingUser && (
        <div
          className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateUserAdmin(editingUser.id, {
                role: editRole,
                status: editStatus,
                totalLimit: editLimit,
                shareCapital: editShare,
                kycVerified: editKyc,
              });
              setEditingUser(null);
            }}
            className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h2 className="font-display text-base font-bold text-ink">
                Manage {editingUser.fullName}
              </h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  Assigned Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full min-h-[44px] px-3 bg-canvas border border-line rounded-xl text-xs font-semibold"
                >
                  <option value={UserRole.CASHIER}>Store Cashier</option>
                  <option value={UserRole.SHAREHOLDER}>Shareholder</option>
                  <option value={UserRole.MANAGER}>Loan Manager</option>
                  <option value={UserRole.ADMIN}>System Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')
                  }
                  disabled={editingUser.id === currentAdminId}
                  className="w-full min-h-[44px] px-3 bg-canvas border border-line rounded-xl text-xs font-semibold"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            {editRole === UserRole.SHAREHOLDER && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">
                    Credit Limit (PHP)
                  </label>
                  <input
                    type="number"
                    value={editLimit}
                    onChange={(e) => setEditLimit(Number(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">
                    Share Capital (PHP)
                  </label>
                  <input
                    type="number"
                    value={editShare}
                    onChange={(e) => setEditShare(Number(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums"
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2.5 text-xs font-medium text-ink cursor-pointer min-h-[40px]">
              <input
                type="checkbox"
                checked={editKyc}
                onChange={(e) => setEditKyc(e.target.checked)}
                className="w-4 h-4 accent-brand"
              />
              <span>National ID &amp; KYC Verified</span>
            </label>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-inverse text-ink-inverse text-sm font-semibold cursor-pointer"
            >
              Save Account Overrides
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
