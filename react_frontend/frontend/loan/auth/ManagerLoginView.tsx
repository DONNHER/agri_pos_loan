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
} from 'lucide-react';
import {
  GENERATED_ASSETS,
  getRoleLabel,
  PlatformUser,
  UserRole,
} from '../shared/creditData';
import { SafeImage } from '../shared/components/SafeImage';
import { api, type LoginCredentials } from '../shared/api';

interface ManagerLoginViewProps {
  users: PlatformUser[];
  onLoginAsUser: (userId: string, triggerOnboarding?: boolean) => void;
  onApiLogin?: (credentials: LoginCredentials) => Promise<void>;
}

export const ManagerLoginView: React.FC<ManagerLoginViewProps> = ({
  users,
  onLoginAsUser,
  onApiLogin,
}) => {
  const [identifier, setIdentifier] = useState('manager@tikcredit.ph');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);

  const sampleManager = users.find((u) => u.role === UserRole.MANAGER);

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
      (clean === 'manager@tikcredit.ph' ? sampleManager : undefined);

    if (!matched) {
      setErrorMsg('Account not found. Try manager@tikcredit.ph.');
      return;
    }
    if (matched.status === 'SUSPENDED') {
      setErrorMsg('This account is currently suspended by an Administrator.');
      return;
    }
    if (matched.role !== UserRole.MANAGER) {
      setErrorMsg('This is a Manager portal. Please use the correct login page for your role.');
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
          Manager Portal · Loan Operations & Approvals
        </span>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Manager Features */}
          <section className="hidden lg:flex lg:col-span-5 bg-success text-on-brand rounded-3xl p-8 flex-col justify-between">
            <div className="space-y-6">
              <p className="text-xs font-medium text-on-brand/70 tracking-wide">
                Loan Operations Manager Portal
              </p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight leading-tight text-on-brand">
                Verify KYC, approve loans, resolve tickets, and manage member relationships.
              </h1>
              <p className="text-sm text-on-brand/80 leading-relaxed">
                Complete oversight of loan applications, credit decisions, and member support — all from one dashboard.
              </p>

              {/* Features */}
              <div className="bg-on-brand/10 rounded-2xl p-5 space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>KYC & National ID verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Approve/decline loan applications</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Disburse funds to GCash/Maya</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Resolve member support tickets</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Credit standing assessment</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-on-brand/10 flex items-center gap-3.5">
              <SafeImage
                src={GENERATED_ASSETS.avatarLoanManager}
                alt="Loan Manager"
                fallbackText="LM"
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-on-brand/70 leading-relaxed">
                  "Full visibility on every loan request — from KYC to disbursement in one workflow."
                </p>
                <p className="text-[11px] text-on-brand/50 mt-0.5">
                  Loan Operations Manager · Metro Manila Lending Hub
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Login Form */}
          <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-5">
                <p className="text-xs font-medium text-success mb-1">
                  Manager Sign In
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                  Sign in to Loan Operations
                </h2>
                <p className="text-sm text-ink-secondary mt-1">
                  Access loan approvals, member verification, and ticket resolution.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sample Manager Account */}
                {sampleManager && (
                  <div className="bg-canvas rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <SafeImage
                          src={sampleManager.avatarPath}
                          alt={sampleManager.fullName}
                          fallbackText="LM"
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-success">
                            Loan Manager · {getRoleLabel(UserRole.MANAGER)}
                          </p>
                          <p className="text-sm font-bold text-ink truncate">
                            {sampleManager.fullName} ({sampleManager.handle})
                          </p>
                          <p className="text-xs text-ink-secondary truncate font-mono tabular-nums">
                            {sampleManager.email} · Metro Manila Lending Hub
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onLoginAsUser(sampleManager.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-success hover:bg-success-hover text-on-brand text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <span>Sign In as Manager</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-line">
                  <p className="text-xs font-medium text-ink-secondary mb-3">Or sign in with credentials</p>

                  <div>
                    <label
                      htmlFor="manager-identifier"
                      className="block text-xs font-medium text-ink-secondary mb-1.5"
                    >
                      Email or Handle
                    </label>
                    <input
                      id="manager-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="manager@tikcredit.ph"
                      className="w-full min-h-[48px] px-4 py-3 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="manager-password"
                      className="block text-xs font-medium text-ink-secondary mb-1.5"
                    >
                      Password (Demo: password123)
                    </label>
                    <div className="relative flex items-center bg-canvas border border-line rounded-xl focus-within:border-ink">
                      <input
                        id="manager-password"
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
                    className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-success hover:bg-success-hover text-on-brand font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Manager Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <footer className="mt-6 pt-4 border-t border-line text-center text-xs text-ink-secondary">
              <p>TikCredit Manager Portal — Authorized access only.</p>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
};