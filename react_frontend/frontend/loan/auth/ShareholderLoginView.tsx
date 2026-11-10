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

interface ShareholderLoginViewProps {
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

export const ShareholderLoginView: React.FC<ShareholderLoginViewProps> = ({
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
        'Account not found. Try shareholder@tikcredit.ph or farmer@tikcredit.ph.'
      );
      return;
    }
    if (matched.status === 'SUSPENDED') {
      setErrorMsg(
        'This account is currently suspended by an Administrator.'
      );
      return;
    }
    if (matched.role !== UserRole.SHAREHOLDER) {
      setErrorMsg('This is a Shareholder portal. Please use the correct login page for your role.');
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
          Shareholder Portal · Personal Revolving Credit & Cash Loans
        </span>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Shareholder Benefits */}
          <section className="hidden lg:flex lg:col-span-5 bg-brand text-on-brand rounded-3xl p-8 flex-col justify-between">
            <div className="space-y-6">
              <p className="text-xs font-medium text-on-brand/70 tracking-wide">
                Shareholder Member Portal
              </p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight leading-tight text-on-brand">
                Your personal credit line, instant cash loans, and transparent repayments.
              </h1>
              <p className="text-sm text-on-brand/80 leading-relaxed">
                Complete KYC onboarding, request cash loans up to your limit, track installments, and manage support tickets — all in one place.
              </p>

              {/* Benefits */}
              <div className="bg-on-brand/10 rounded-2xl p-5 space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Revolving credit up to ₱500,000</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Instant GCash/Maya disbursement</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Zero early-payoff fees</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>Flexible 1-12 month terms</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>24/7 support ticket system</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-on-brand/10 flex items-center gap-3.5">
              <SafeImage
                src={GENERATED_ASSETS.avatarShareholder}
                alt="Dionherlove Cuarteros"
                fallbackText="DC"
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-on-brand/70 leading-relaxed">
                  "Approved in minutes with instant GCash disbursement and zero early-payoff fees."
                </p>
                <p className="text-[11px] text-on-brand/50 mt-0.5">
                  Dionherlove Cuarteros · Shareholder ID SH-8849-2026
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Login Form */}
          <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-5">
                <p className="text-xs font-medium text-brand mb-1">
                  Shareholder Sign In
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                  {step === 'otp'
                    ? 'Enter 4-digit SMS code'
                    : authTab === 'register'
                    ? 'New Member Onboarding'
                    : 'Sign in to your account'}
                </h2>
                <p className="text-sm text-ink-secondary mt-1">
                  {step === 'otp'
                    ? 'Demo verification code auto-filled: 8429.'
                    : 'Choose a sample account below, or log in with your credentials.'}
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
                      Sample Accounts
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

                  {/* TAB 1: SAMPLE SHAREHOLDER ACCOUNTS */}
                  {authTab === 'sample' && (
                    <div className="space-y-3">
                      {/* Sample Shareholder */}
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
                                  Shareholder · {getRoleLabel(UserRole.SHAREHOLDER)}
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
                          placeholder="shareholder@tikcredit.ph / farmer@tikcredit.ph"
                          className="w-full min-h-[48px] px-4 py-3 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            {
                              label: 'Fill Shareholder',
                              val: 'shareholder@tikcredit.ph',
                            },
                            { label: 'Fill Farmer', val: 'farmer@tikcredit.ph' },
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
                          Starts with ₱0.00 balance & zero loan history · Launches 3-step KYC onboarding
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
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-subtle hover:bg-line text-[11px] font-semibold text-ink cursor-pointer"
                        >
                          Fill Demo Data
                        </button>
                      </div>

                      <div>
                        <label
                          htmlFor="reg-name"
                          className="block text-xs font-medium text-ink-secondary mb-1.5"
                        >
                          Full Name
                        </label>
                        <input
                          id="reg-name"
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Rosa Macapagal"
                          className="w-full min-h-[48px] px-4 py-3 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="reg-handle"
                          className="block text-xs font-medium text-ink-secondary mb-1.5"
                        >
                          TikCredit Handle
                        </label>
                        <div className="relative flex items-center bg-canvas border border-line rounded-xl focus-within:border-ink">
                          <span className="min-w-[44px] flex items-center justify-center text-ink-secondary">
                            @
                          </span>
                          <input
                            id="reg-handle"
                            type="text"
                            value={regHandle}
                            onChange={(e) => setRegHandle(e.target.value)}
                            placeholder="rosam"
                            className="w-full min-h-[48px] px-4 py-3 bg-transparent text-sm text-ink focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="reg-phone"
                          className="block text-xs font-medium text-ink-secondary mb-1.5"
                        >
                          Mobile Number (+63)
                        </label>
                        <input
                          id="reg-phone"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="917 840 5512"
                          className="w-full min-h-[48px] px-4 py-3 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="reg-email"
                          className="block text-xs font-medium text-ink-secondary mb-1.5"
                        >
                          Email (Optional)
                        </label>
                        <input
                          id="reg-email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="rosa@tikcredit.ph"
                          className="w-full min-h-[48px] px-4 py-3 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
                        />
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
                        className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                      >
                        <span>Create Account & Start Onboarding</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </>
              ) : (
                /* OTP VERIFICATION STEP */
                <div className="space-y-4">
                  <p className="text-sm text-ink-secondary text-center">
                    We sent a 4-digit verification code to your registered mobile number.
                  </p>
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <input
                          key={i}
                          id={`login-otp-${i}`}
                          type="text"
                          maxLength={1}
                          value={otpDigits[i]}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          className="w-12 h-14 text-center text-xl font-bold bg-canvas border border-line rounded-xl focus:outline-none focus:border-ink"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                    {errorMsg && (
                      <p
                        className="text-xs font-medium text-danger text-center flex items-center justify-center gap-1.5"
                        role="alert"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errorMsg}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <span>Verify & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('form');
                        setErrorMsg('');
                      }}
                      className="w-full min-h-[44px] px-4 py-2 rounded-xl text-ink-secondary hover:text-ink font-semibold text-xs cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </form>
                </div>
              )}
            </div>

            <footer className="mt-6 pt-4 border-t border-line text-center text-xs text-ink-secondary">
              <p>By continuing, you agree to TikCredit's <a href="#" className="text-brand hover:underline">Terms of Service</a> and <a href="#" className="text-brand hover:underline">Privacy Policy</a>.</p>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
};