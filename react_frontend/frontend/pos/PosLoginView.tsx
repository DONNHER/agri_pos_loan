import React, { useState } from 'react';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Lock,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  User,
} from 'lucide-react';
import { PosRole } from './PosWorkspace';

interface PosLoginViewProps {
  onLogin: (role: PosRole, cashierName: string) => void;
}

export const PosLoginView: React.FC<PosLoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<PosRole>('CASHIER');
  const [passcode, setPasscode] = useState('1234');
  const [cashierName, setCashierName] = useState('Maria Santos');
  const [errorMsg, setErrorMsg] = useState('');

  const sampleAccounts = [
    {
      role: 'CASHIER' as PosRole,
      title: 'POS Cashier Counter',
      name: 'Maria Santos',
      badge: 'Sales Register & Checkout',
      defaultPin: '1234',
      description: 'Barcode/SKU search, Box & Sack break down, cart register, cash and wallet payment receipt printing.',
    },
    {
      role: 'ADMIN' as PosRole,
      title: 'Store Administrator',
      name: 'Elena Solis (Admin)',
      badge: 'Full Inventory & Disaster Recovery',
      defaultPin: '1234',
      description: 'Manage master product catalog, configure Box-to-Piece and Sack-to-Kg ratios, export sales CSVs, and restore backup snapshots.',
    },
    {
      role: 'SHAREHOLDER' as PosRole,
      title: 'Shareholder Member',
      name: 'Eduardo Ramos (Shareholder)',
      badge: 'Read-Only Catalog & Price Check',
      defaultPin: '1234',
      description: 'Browse wholesale & retail agricultural price list per box, sack, piece, and kilogram without modifying registers.',
    },
  ];

  const handleSelectRolePreset = (acc: typeof sampleAccounts[0]) => {
    setSelectedRole(acc.role);
    setCashierName(acc.name);
    setPasscode(acc.defaultPin);
    setErrorMsg('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierName.trim()) {
      setErrorMsg('Please specify operator name');
      return;
    }
    if (passcode.length < 4) {
      setErrorMsg('Enter at least 4-digit POS register PIN (Demo: 1234)');
      return;
    }
    setErrorMsg('');
    onLogin(selectedRole, cashierName.trim());
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between py-6 px-4 sm:px-8">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand text-on-brand flex items-center justify-center font-extrabold text-sm shadow-xs">
            POS
          </div>
          <div>
            <span className="font-display text-lg font-extrabold tracking-tight text-ink">
              AgriTrade POS &amp; Inventory
            </span>
            <p className="text-[11px] text-ink-secondary">
              Cooperative Multi-Unit Trading System (Box · Sack · Piece · Kg)
            </p>
          </div>
        </div>

        <a
          href="/"
          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-surface hover:bg-subtle border border-line text-xs font-semibold text-ink inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Switch to Loan App</span>
          <ArrowRight className="w-3.5 h-3.5 text-brand" />
        </a>
      </header>

      {/* Main Login Card Grid */}
      <main className="w-full max-w-5xl mx-auto my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 6 Cols: Role Presets Selection */}
          <section className="lg:col-span-6 bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-4">
            <div>
              <p className="text-xs font-semibold text-brand">Independent POS Application Entry</p>
              <h1 className="font-display text-2xl font-extrabold text-ink mt-0.5">
                Sign in to POS Register
              </h1>
              <p className="text-xs text-ink-secondary mt-1">
                Select your cooperative role to enter the dedicated POS terminal:
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {sampleAccounts.map((acc) => {
                const isSelected = selectedRole === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectRolePreset(acc)}
                    className={`w-full p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-subtle border-brand shadow-xs'
                        : 'bg-canvas border-line hover:border-ink-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isSelected ? 'bg-brand' : 'bg-line'
                          }`}
                        />
                        <span className="font-display text-sm font-bold text-ink">
                          {acc.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface font-semibold text-ink-secondary">
                        {acc.badge}
                      </span>
                    </div>

                    <p className="text-xs text-ink font-semibold mt-1.5">{acc.name}</p>
                    <p className="text-[11px] text-ink-secondary leading-relaxed mt-0.5">
                      {acc.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right 6 Cols: Authorization Form */}
          <section className="lg:col-span-6 bg-surface border border-line rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
            <div className="space-y-5">
              <div className="pb-3 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">
                    Operator Authorization
                  </h2>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Terminal PIN authorization for {selectedRole}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-subtle flex items-center justify-center">
                  <Lock className="w-4 h-4 text-ink" />
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    Terminal Operator Name
                  </label>
                  <div className="flex items-center bg-canvas border border-line rounded-xl px-3.5">
                    <User className="w-4 h-4 text-ink-muted mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      placeholder="e.g. Maria Santos"
                      className="w-full min-h-[44px] bg-transparent text-sm text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    4-Digit Register PIN (Demo: 1234)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="1234"
                    className="w-full min-h-[44px] px-3.5 bg-canvas border border-line rounded-xl font-mono text-base tracking-widest font-bold text-ink focus:outline-none focus:border-ink"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-danger font-medium">{errorMsg}</p>
                )}

                <div className="p-3 bg-canvas rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-success font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Multi-unit cooperative register connected</span>
                  </div>
                  <p className="text-ink-secondary text-[11px]">
                    Role <strong className="text-ink">{selectedRole}</strong> grants {selectedRole === 'SHAREHOLDER' ? 'read-only prices monitor' : 'full checkout & inventory capabilities'}.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Open {selectedRole} POS Terminal</span>
                </button>
              </form>
            </div>

            <div className="pt-4 border-t border-line text-center text-xs text-ink-secondary">
              Distributable Standalone POS Client · Offline SQLite / LocalStorage Resilient
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto text-center text-xs text-ink-muted pt-4 border-t border-line">
        AgriTrade POS &amp; Inventory Client · Agricultural Multi-Unit Cooperative Terminal
      </footer>
    </div>
  );
};
