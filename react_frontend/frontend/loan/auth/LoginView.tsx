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
} from 'lucide-react';
import {
  GENERATED_ASSETS,
  getRoleLabel,
  PlatformUser,
  UserRole,
} from '../shared/creditData';
import { SafeImage } from '../shared/components/SafeImage';
import { api, type LoginCredentials } from '../shared/api';

interface LoginViewProps {
  users: PlatformUser[];
  onLoginAsUser: (userId: string, triggerOnboarding?: boolean) => void;
  onRegisterMember: (payload: {
    fullName: string;
    handle: string;
    phone: string;
    email: string;
  }) => void;
  onApiLogin?: (credentials: LoginCredentials) => Promise<void>;
}

type AuthTab = 'sample' | 'credentials' | 'register';

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLoginAsUser,
  onRegisterMember,
  onApiLogin,
}) => {
  const [authTab, setAuthTab] = useState<AuthTab>('sample');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [identifier, setIdentifier] = useState('shareholder@tikcredit.ph');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['8', '4', '2', '9']);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // New Member Registration fields
  const [regName, setRegName] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regPhone, setRegPhone] = useState('917 840 5512');
  const [regEmail, setRegEmail] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);

  const sampleShareholder =
    users.find((u) => u.id === 'user-shareholder-1') ||
    users.find((u) => u.role === UserRole.SHAREHOLDER);
  const sampleOnboardingMember = users.find(
    (u) => u.id === 'user-shareholder-2'
  );
  const sampleManager = users.find((u) => u.role === UserRole.MANAGER);
  const sampleAdmin = users.find((u) => u.role === UserRole.ADMIN);

  const handleManualSubmit = (e: React.FormEvent) => {
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
      (clean === 'farmer@tikcredit.ph' ? sampleShareholder : undefined);

    if (!matched) {
      setErrorMsg(
        'Account not found. Try shareholder@tikcredit.ph, manager@tikcredit.ph, or admin@tikcredit.ph.'
      );
      return;
    }
    if (matched.status === 'SUSPENDED') {
      setErrorMsg(
        'This account is currently suspended by an Administrator.'
      );
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
    setPendingUserId(matched.id);
    setStep('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 3) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpDigits.join('').length < 4) {
      setErrorMsg('Enter all 4 SMS verification digits.');
      return;
    }
    if (pendingUserId) {
      onLoginAsUser(pendingUserId);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!regName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    const cleanPhone = regPhone.startsWith('+63')
      ? regPhone.trim()
      : `+63 ${regPhone.trim()}`;
    const cleanHandle = regHandle.trim()
      ? regHandle.trim().startsWith('@')
        ? regHandle.trim()
        : `@${regHandle.trim()}`
      : `@${
          regName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 12) || 'member'
        }`;

    onRegisterMember({
      fullName: regName.trim(),
      handle: cleanHandle,
      phone: cleanPhone,
      email: regEmail.trim() || `${cleanHandle.slice(1)}@tikcredit.ph`,
    });
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <header className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between gap-8">
        <span className="font-display text-xl font-extrabold tracking-tight text-ink whitespace-nowrap shrink-0">
          TikCredit
        </span>
        <span className="text-xs text-ink-secondary whitespace-nowrap shrink-0">
          Personal Revolving Credit &amp; Cash Loans · PH (+63)
        </span>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: End-to-End 3-Role Business Workflow Overview */}
          <section className="hidden lg:flex lg:col-span-5 bg-inverse text-ink-inverse rounded-3xl p-8 flex-col justify-between">
            <div className="space-y-6">
              <p className="text-xs font-medium text-ink-inverse-muted tracking-wide">
                End-to-End Revolving Credit Architecture
              </p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight leading-tight text-ink-inverse">
                Instant cash credit, manager verification, and full system governance.
              </h1>
              <p className="text-sm text-ink-inverse-subtle leading-relaxed">
                Every loan application, installment payment, notification alert, support ticket, user impersonation, and snapshot backup stays synchronized across all three roles.
              </p>

              {/* 3-Step Business Pipeline Summary */}
              <div className="bg-inverse-elevated rounded-2xl p-5 space-y-4 text-xs">
                <div className="pb-3 border-b border-ink-inverse/10">
                  <p className="font-semibold text-ink-inverse">
                    01. Shareholder Borrower
                  </p>
                  <p className="text-ink-inverse-muted mt-0.5">
                    Complete KYC onboarding, submit Cash Loan requests, pay installments, track notifications, and manage tickets in Profile.
                  </p>
                </div>
                <div className="pb-3 border-b border-ink-inverse/10">
                  <p className="font-semibold text-ink-inverse">
                    02. Loan Operations Manager
                  </p>
                  <p className="text-ink-inverse-muted mt-0.5">
                    Verify National ID KYC &amp; credit standing, approve/disburse or decline loan applications, and resolve member tickets.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-ink-inverse">
                    03. System Administrator
                  </p>
                  <p className="text-ink-inverse-muted mt-0.5">
                    Manage users with live session impersonation, oversee loans &amp; feedbacks, export reports, inspect audit logs, and restore backups.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-ink-inverse/10 flex items-center gap-3.5">
              <SafeImage
                src={GENERATED_ASSETS.avatarShareholder}
                alt="Dionherlove Cuarteros"
                fallbackText="DC"
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-ink-inverse-subtle leading-relaxed">
                  “Approved in minutes by our credit manager with instant GCash disbursement and zero early-payoff fees.”
                </p>
                <p className="text-[11px] text-ink-inverse-muted mt-0.5">
                  Dionherlove Cuarteros · Shareholder ID SH-8849-2026
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Role Sample Accounts + Credential Login + Onboarding Signup */}
          <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-5">
                <p className="text-xs font-medium text-brand mb-1">
                  TikCredit Role-Based Portal
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                  {step === 'otp'
                    ? 'Enter 4-digit SMS code'
                    : authTab === 'register'
                    ? 'New Member Onboarding'
                    : 'Sign in to TikCredit'}
                </h2>
                <p className="text-sm text-ink-secondary mt-1">
                  {step === 'otp'
                    ? 'Demo verification code auto-filled: 8429.'
                    : 'Choose a sample role account below to verify the business workflow immediately, or log in with credentials.'}
                </p>
              </div>

              {step === 'form' ? (
                <>
                  {/* Mode Switcher */}
                  <div
                    className="grid grid-cols-3 gap-1 p-1 bg-subtle rounded-xl mb-5"
                    role="tablist"
                    aria-label="Authentication mode"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === 'sample'}
                      onClick={() => {
                        setAuthTab('sample');
                        setErrorMsg('');
                      }}
                      className={`min-h-[42px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        authTab === 'sample'
                          ? 'bg-surface text-ink shadow-xs'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      3 Sample Roles
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === 'credentials'}
                      onClick={() => {
                        setAuthTab('credentials');
                        setErrorMsg('');
                      }}
                      className={`min-h-[42px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        authTab === 'credentials'
                          ? 'bg-surface text-ink shadow-xs'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      Email / Phone
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === 'register'}
                      onClick={() => {
                        setAuthTab('register');
                        setErrorMsg('');
                      }}
                      className={`min-h-[42px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        authTab === 'register'
                          ? 'bg-surface text-ink shadow-xs'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      New Member
                    </button>
                  </div>

                  {/* TAB 1: 3 SAMPLE ROLE LOGIN ACCOUNTS */}
                  {authTab === 'sample' && (
                    <div className="space-y-3">
                      {/* Role 1: Shareholder */}
                      {sampleShareholder && (
                        <div className="bg-canvas rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <SafeImage
                                src={sampleShareholder.avatarPath}
                                alt={sampleShareholder.fullName}
                                fallbackText="DC"
                                className="w-11 h-11 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-brand">
                                  Role 1 · {getRoleLabel(UserRole.SHAREHOLDER)}
                                </p>
                                <p className="text-sm font-bold text-ink truncate">
                                  {sampleShareholder.fullName} (
                                  {sampleShareholder.handle})
                                </p>
                                <p className="text-xs text-ink-secondary truncate font-mono tabular-nums">
                                  {sampleShareholder.email} · Limit ₱50,000 · PIN 123456
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onLoginAsUser(sampleShareholder.id)
                              }
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                            >
                              <span>Sign In</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Zero-Loan New Account & Onboarding Triggers */}
                          <div className="pt-2.5 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthTab('register');
                                setRegName('Rosa Macapagal');
                                setRegHandle('@rosam');
                                setRegPhone('917 840 5512');
                                setRegEmail('rosa@tikcredit.ph');
                                setErrorMsg('');
                              }}
                              className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-ink whitespace-nowrap cursor-pointer min-h-[36px]"
                            >
                              <UserPlus className="w-3.5 h-3.5 shrink-0" />
                              <span>Start New Account (Zero Loan Record)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                sampleOnboardingMember
                                  ? onLoginAsUser(
                                      sampleOnboardingMember.id,
                                      true
                                    )
                                  : onLoginAsUser(sampleShareholder.id, true)
                              }
                              className="inline-flex items-center gap-1 font-semibold text-ink-secondary hover:text-ink whitespace-nowrap cursor-pointer min-h-[36px]"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-brand shrink-0" />
                              <span>
                                Resume{' '}
                                {sampleOnboardingMember?.handle || '@mateov'}{' '}
                                Onboarding
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Role 2: Loan Manager */}
                      {sampleManager && (
                        <div className="bg-canvas rounded-2xl p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <SafeImage
                              src={sampleManager.avatarPath}
                              alt={sampleManager.fullName}
                              fallbackText="MR"
                              className="w-11 h-11 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-success">
                                Role 2 · Loan Manager (Approvals &amp; Tickets)
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
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                          >
                            <span>Sign In</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Role 3: System Admin */}
                      {sampleAdmin && (
                        <div className="bg-canvas rounded-2xl p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <SafeImage
                              src={sampleAdmin.avatarPath}
                              alt={sampleAdmin.fullName}
                              fallbackText="ES"
                              className="w-11 h-11 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-ink">
                                Role 3 · System Admin (Users, Impersonation, Logs &amp; Backups)
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
                            <span>Sign In</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: MANUAL CREDENTIAL LOGIN */}
                  {authTab === 'credentials' && (
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="manual-identifier"
                          className="block text-xs font-medium text-ink-secondary mb-1.5"
                        >
                          Email, TikCredit Handle, or Mobile Number
                        </label>
                        <input
                          id="manual-identifier"
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="shareholder@tikcredit.ph / manager@tikcredit.ph / admin@tikcredit.ph"
                          className="w-full min-h-[48px] px-4 py-3 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            {
                              label: 'Fill Shareholder',
                              val: 'shareholder@tikcredit.ph',
                            },
                            { label: 'Fill Manager', val: 'manager@tikcredit.ph' },
                            { label: 'Fill Admin', val: 'admin@tikcredit.ph' },
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => setIdentifier(preset.val)}
                              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-subtle hover:bg-line text-[11px] font-semibold text-ink cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="manual-password"
                          className="block text-xs font-medium text-ink-secondary mb-1.5"
                        >
                          Password (Demo: password123)
                        </label>
                        <div className="relative flex items-center bg-canvas border border-line rounded-xl focus-within:border-ink">
                          <input
                            id="manual-password"
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
                        className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApiLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Signing in...</span>
                          </>
                        ) : (
                          <>
                            <span>Continue with 2FA OTP</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* TAB 3: NEW MEMBER REGISTRATION -> LAUNCHES ONBOARDING */}
                  {authTab === 'register' && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary pb-1">
                        <span>
                          Starts with ₱0.00 balance &amp; zero loan history · Launches 3-step KYC onboarding
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRegName('Rosa Macapagal');
                            setRegHandle('@rosam');
                            setRegPhone('917 840 5512');
                            setRegEmail('rosa@tikcredit.ph');
                            setErrorMsg('');
                          }}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-subtle hover:bg-line text-[11px] font-semibold text-ink whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Quick-Fill Applicant
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-ink-secondary mb-1">
                            Applicant Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="e.g. Rosa Macapagal"
                            className="w-full min-h-[46px] px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-secondary mb-1">
                            TikCredit Handle
                          </label>
                          <input
                            type="text"
                            value={regHandle}
                            onChange={(e) => setRegHandle(e.target.value)}
                            placeholder="@rosam"
                            className="w-full min-h-[46px] px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-ink-secondary mb-1">
                            Mobile Number (PH +63)
                          </label>
                          <input
                            type="tel"
                            required
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full min-h-[46px] px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums text-ink focus:outline-none focus:border-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-secondary mb-1">
                            Email Address (Optional)
                          </label>
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="rosa@tikcredit.ph"
                            className="w-full min-h-[46px] px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                          />
                        </div>
                      </div>

                      {errorMsg && (
                        <p
                          className="text-xs font-medium text-danger"
                          role="alert"
                        >
                          {errorMsg}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Create Shareholder Account &amp; Start Onboarding</span>
                      </button>
                    </form>
                  )}
                </>
              ) : (
                /* OTP Verification Step */
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="grid grid-cols-4 gap-3 max-w-xs">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`login-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        aria-label={`OTP digit ${idx + 1}`}
                        className="h-14 text-center font-mono tabular-nums text-xl font-bold text-ink bg-canvas border border-line rounded-xl focus:outline-none focus:border-brand"
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>2FA security token validated</span>
                  </div>

                  {errorMsg && (
                    <p
                      className="text-xs font-medium text-danger"
                      role="alert"
                    >
                      {errorMsg}
                    </p>
                  )}

                  <div className="space-y-2.5">
                    <button
                      type="submit"
                      className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Verify &amp; Enter Role Workspace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('form');
                        setErrorMsg('');
                      }}
                      className="w-full min-h-[44px] rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink cursor-pointer"
                    >
                      Back to login methods
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="pt-5 mt-5 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>RBAC Role Isolation &amp; Audit Logging</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-ink-secondary" />
                <span>GCash · Maya · BPI · GoTyme · UnionBank</span>
              </span>
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-4 text-xs text-ink-muted flex flex-wrap items-center justify-between gap-2">
        <span>TikCredit Revolving Credit &amp; Cash Loan System</span>
        <span>Shareholder · Manager · Admin Live State</span>
      </footer>
    </div>
  );
};
