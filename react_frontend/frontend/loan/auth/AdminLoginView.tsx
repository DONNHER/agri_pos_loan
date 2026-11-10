import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus,
  Loader2,
  AlertCircle,
  Briefcase,
  Users,
  ClipboardList,
  Shield,
  Database,
  BarChart3,
} from 'lucide-react';
import {
  GENERATED_ASSETS,
  getRoleLabel,
  PlatformUser,
  UserRole,
} from '../shared/creditData';
import { SafeImage } from '../shared/components/SafeImage';
import { api, type LoginCredentials } from '../shared/api';

interface AdminLoginViewProps {
  users: PlatformUser[];
  onLoginAsUser: (userId: string, triggerOnboarding?: boolean) => void;
  onApiLogin?: (credentials: LoginCredentials) => Promise<void>;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  users,
  onLoginAsUser,
  onApiLogin,
}) => {
  const [identifier, setIdentifier] = useState('admin@tikcredit.ph');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);

  const sampleAdmin = users.find((u) => u.role === UserRole.ADMIN);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const clean = identifier.trim().toLowerCase();
    const matched =
      users.find(
        (u) =>
          u.email.toLowerCase() === clean ||
          u.handle.toLowerCase() === clean ||
          u.handle.toLowerCase() === `@${clean}` ||
          u.phone.replace(/\D/g, '').endsWith(clean.replace(/\D/g, ''))
      ) ||
      (clean === 'admin@tikcredit.ph' ? sampleAdmin : undefined);

    if (!matched) {
      setErrorMsg('Account not found. Try admin@tikcredit.ph.');
      return;
    }
    if (matched.status === 'SUSPENDED') {
      setErrorMsg('This account is currently suspended.');
      return;
    }
    if (matched.role !== UserRole.ADMIN) {
      setErrorMsg('This is an Admin portal. Please use the correct login page for your role.');
      return;
    }
    if (passwordInput.trim().length < 4) {
      setErrorMsg('Please enter a valid password (demo: password123).');
      return;
    }

    // If API login is available, use it
    if (onApiLogin) {
      setIsApiLoading(true);
      onApiLogin({ email: identifier.trim(), password: passwordInput })
        .then(() => {
          setIsApiLoading(false);
        })
        .catch((err) => {
          setIsApiLoading(false);
          setErrorMsg(err.message || 'Login failed. Please try again.');
        });
      return;
    }

    // Fallback to demo mode
    onLoginAsUser(matched.id);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <header className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between gap-8">
        <span className="font-display text-xl font-extrabold tracking-tight text-ink whitespace-nowrap shrink-0">
          TikCredit
        </span>
        <span className="text-xs text-ink-secondary whitespace-nowrap shrink-0">
          Admin Portal · System Governance & Control
        </span>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Admin Features */}
          <section className="hidden lg:flex lg:col-span-5 bg-inverse text-ink-inverse rounded-3xl p-8 flex-col justify-between">
            <div className="space-y-6">
              <p className="text-xs font-medium text-ink-inverse/70 tracking-wide">
                System Administrator Portal
              </p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight leading-tight text-ink-inverse">
                Full system control: users, impersonation, audit logs, backups, and governance.
              </h1>
              <p className="text-sm text-ink-inverse/80 leading-relaxed">
                Manage all users with live session impersonation, oversee loans & feedbacks, export reports, inspect audit logs, and restore backup snapshots.
              </p>

              {/* Features */}
              <div className="bg-ink-inverse/10 rounded-2xl p-5 space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>User management & live impersonation</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Loan governance & oversight</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Audit logs & activity monitoring</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Backup snapshots & disaster recovery</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>System reports & data exports</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-ink-inverse/10 flex items-center gap-3.5">
              <SafeImage
                src={GENERATED_ASSETS.avatarSystemAdmin}
                alt="System Admin"
                fallbackText="SA"
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-ink-inverse/70 leading-relaxed">
                  "Complete system visibility with instant impersonation and one-click backup restore."
                </p>
                <p className="text-[11px] text-ink-inverse/50 mt-0.5">
                  System Administrator · Full System Control
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Login Form */}
          <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-5">
                <p className="text-xs font-medium text-ink mb-1">
                  Administrator Sign In
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                  Sign in to System Administration
                </h2>
                <p className="text-sm text-ink-secondary mt-1">
                  Full system control: users, impersonation, logs, backups, and governance.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sample Admin Account */}
                {sampleAdmin && (
                  <div className="bg-canvas rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <SafeImage
                          src={sampleAdmin.avatarPath}
                          alt={sampleAdmin.fullName}
                          fallbackText="SA"
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink">
                            System Admin · {getRoleLabel(UserRole.ADMIN)}
                          </p>
                          <p className="text-sm font-bold text-ink truncate">
                            {sampleAdmin.fullName} ({sampleAdmin.handle})
                          </p>
                          <p className="text-xs text-ink-secondary truncate font-mono tabular-nums">
                            {sampleAdmin.email} · Full System Control
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onLoginAsUser(sampleAdmin.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <span>Sign In as Admin</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-line">
                  <p className="text-xs font-medium text-ink-secondary mb-3">Or sign in with credentials</p>

                  <div>
                    <label
                      htmlFor="admin-identifier"
                      className="block text-xs font-medium text-ink-secondary mb-1.5"
                    >
                      Email or Handle
                    </label>
                    <input
                      id="admin-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@tikcredit.ph"
                      className="w-full min-h-[48px] px-4 py-3 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-password"
                      className="block text-xs font-medium text-ink-secondary mb-1.5"
                    >
                      Password (Demo: password123)
                    </label>
                    <div className="relative flex items-center bg-canvas border border-line rounded-xl focus-within:border-ink">
                      <input
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full min-h-[48px] px-4 py-3 bg-transparent text-sm text-ink focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-secondary"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <p
                      className="text-xs font-medium text-danger flex items-center gap-1.5"
                      role="alert"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isApiLoading}
                    className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Admin Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <footer className="mt-6 pt-4 border-t border-line text-center text-xs text-ink-secondary">
              <p>TikCredit Admin Portal — Authorized access only. All actions are audited.</p>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
};