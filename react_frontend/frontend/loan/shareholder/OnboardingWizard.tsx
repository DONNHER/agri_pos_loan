import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  MapPin,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import {
  formatPHP,
  LinkedChannel,
  PlatformUser,
} from '../shared/creditData';

interface OnboardingWizardProps {
  user: PlatformUser;
  onCompleteOnboarding: (payload: {
    cityAddress: string;
    incomeSource: string;
    monthlyIncome: number;
    shareCapital: number;
    nationalId: string;
    payoutProvider: LinkedChannel['provider'];
    payoutAccountDigits: string;
    securityPin: string;
    activatedLimit: number;
  }) => void;
  onLogout: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  user,
  onCompleteOnboarding,
  onLogout,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const defaultExistingChannel =
    user.channels.find((c) => c.isDefault) || user.channels[0];

  const [cityAddress, setCityAddress] = useState(
    user.cityAddress || 'Quezon City, Metro Manila'
  );
  const [incomeSource, setIncomeSource] = useState(
    user.incomeSource && user.incomeSource !== 'N/A'
      ? user.incomeSource
      : 'Salaried · Digital Operations'
  );
  const [monthlyIncome, setMonthlyIncome] = useState<number>(
    user.monthlyIncome || 45000
  );
  const [shareCapital, setShareCapital] = useState<number>(
    user.shareCapital || 12000
  );

  const [nationalId, setNationalId] = useState(
    user.nationalId && user.nationalId !== 'N/A'
      ? user.nationalId
      : 'PHN-8492-1048-2026'
  );
  const [payoutProvider, setPayoutProvider] =
    useState<LinkedChannel['provider']>(
      defaultExistingChannel?.provider || 'GCash'
    );
  const [payoutNumber, setPayoutNumber] = useState(
    user.phone || '+63 917 840 5512'
  );

  const [pin, setPin] = useState(user.securityPin || '123456');
  const [stepError, setStepError] = useState('');
  const [pinError, setPinError] = useState('');

  // Dynamic Pre-Qualified Credit Limit based on Monthly Income & Share Capital
  const computedLimit = Math.min(
    80000,
    Math.max(
      25000,
      Math.round((shareCapital * 1.8 + monthlyIncome * 0.45) / 1000) * 1000
    )
  );

  const incomePresets = [
    'Salaried · Digital Operations',
    'Salaried · Corporate & Finance',
    'Small Business & Retail',
    'Freelance & Remote Consulting',
    'Government & Public Service',
  ];

  const providers: LinkedChannel['provider'][] = [
    'GCash',
    'Maya',
    'GoTyme Bank',
    'BPI',
    'BDO',
    'UnionBank',
  ];

  const handleNextToStep2 = () => {
    if (!cityAddress.trim()) {
      setStepError('Please enter your city and residence address.');
      return;
    }
    if (monthlyIncome < 10000) {
      setStepError('Minimum declared monthly net income is ₱10,000.');
      return;
    }
    setStepError('');
    setStep(2);
  };

  const handleNextToStep3 = () => {
    if (nationalId.trim().length < 6) {
      setStepError('Please enter a valid Government National ID or UMID number.');
      return;
    }
    if (payoutNumber.replace(/\D/g, '').length < 4) {
      setStepError('Please enter at least the last 4 digits of your payout account.');
      return;
    }
    setStepError('');
    setStep(3);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setPinError('Security PIN must be 6 numeric digits.');
      return;
    }
    const last4 = payoutNumber.replace(/\D/g, '').slice(-4) || '5512';
    onCompleteOnboarding({
      cityAddress: cityAddress.trim() || 'Quezon City, Metro Manila',
      incomeSource,
      monthlyIncome: Math.max(10000, monthlyIncome),
      shareCapital: Math.max(5000, shareCapital),
      nationalId: nationalId.trim() || 'PHN-8492-1048-2026',
      payoutProvider,
      payoutAccountDigits: last4,
      securityPin: pin,
      activatedLimit: computedLimit,
    });
  };

  return (
    <div className="min-h-screen bg-canvas text-ink py-6 px-4 sm:px-6 flex flex-col justify-between">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between pb-4">
        <span className="font-display text-xl font-extrabold tracking-tight">
          TikCredit
        </span>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-ink-secondary font-mono tabular-nums">
            Step {step} / 3
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-surface border border-line font-semibold text-ink-secondary hover:text-ink cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto flex-1 flex items-center py-4">
        <div className="w-full bg-surface border border-line rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-ink-secondary">
              <span>Shareholder &amp; Personal Credit Onboarding</span>
              <span className="font-mono tabular-nums text-brand">
                Pre-qualified Limit: {formatPHP(computedLimit)}
              </span>
            </div>
            <div className="w-full h-2 bg-subtle rounded-full overflow-hidden">
              <div
                className={`w-full h-full bg-brand rounded-full transition-transform duration-200 origin-left ${
                  step === 1
                    ? 'scale-x-[0.333]'
                    : step === 2
                    ? 'scale-x-[0.667]'
                    : 'scale-x-100'
                }`}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-ink">
                  01. Financial &amp; Share Capital Profile
                </h1>
                <p className="text-sm text-ink-secondary mt-1">
                  Welcome, {user.fullName}. Confirm your residence, monthly income, and paid-up share capital to calculate your revolving credit ceiling.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                    City &amp; Residence Address
                  </label>
                  <div className="flex items-center bg-canvas border border-line rounded-xl px-3.5">
                    <MapPin className="w-4 h-4 text-ink-muted shrink-0 mr-2" />
                    <input
                      type="text"
                      value={cityAddress}
                      onChange={(e) => setCityAddress(e.target.value)}
                      className="w-full min-h-[46px] bg-transparent text-sm text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                    Monthly Net Income (PHP)
                  </label>
                  <input
                    type="number"
                    min={10000}
                    max={500000}
                    step={2000}
                    value={monthlyIncome}
                    onChange={(e) =>
                      setMonthlyIncome(Number(e.target.value) || 20000)
                    }
                    className="w-full min-h-[46px] px-3.5 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-ink-secondary mb-2">
                  Primary Employment / Income Source
                </p>
                <div className="flex flex-wrap gap-2">
                  {incomePresets.map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setIncomeSource(source)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        incomeSource === source
                          ? 'bg-inverse text-ink-inverse'
                          : 'bg-canvas text-ink-secondary hover:text-ink'
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-ink-secondary">
                    Paid-Up Share Capital (PHP)
                  </label>
                  <span className="font-mono tabular-nums text-xs font-bold text-ink">
                    {formatPHP(shareCapital)}
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={30000}
                  step={1000}
                  value={shareCapital}
                  onChange={(e) => setShareCapital(Number(e.target.value))}
                  className="w-full h-2 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>

              {stepError && (
                <p className="text-xs font-medium text-danger" role="alert">
                  {stepError}
                </p>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextToStep2}
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to KYC &amp; Wallet</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-ink">
                  02. Identity KYC &amp; Payout Channel
                </h1>
                <p className="text-sm text-ink-secondary mt-1">
                  Provide your Government National ID number and preferred instant disbursement e-wallet or bank account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Government National ID / UMID Number
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full min-h-[48px] px-4 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-ink-secondary mb-2">
                  Primary Loan Disbursement &amp; Repayment Account
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {providers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPayoutProvider(p)}
                      className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        payoutProvider === p
                          ? 'bg-inverse text-ink-inverse'
                          : 'bg-canvas text-ink-secondary'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>{p}</span>
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                  {payoutProvider} Account / Mobile Number
                </label>
                <input
                  type="text"
                  value={payoutNumber}
                  onChange={(e) => setPayoutNumber(e.target.value)}
                  className="w-full min-h-[48px] px-4 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums text-ink focus:outline-none focus:border-ink"
                />
              </div>

              {stepError && (
                <p className="text-xs font-medium text-danger" role="alert">
                  {stepError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStepError('');
                    setStep(1);
                  }}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-canvas hover:bg-subtle text-xs font-semibold text-ink cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextToStep3}
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Security PIN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleFinish} className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-ink">
                  03. Activate Your {formatPHP(computedLimit)} Credit Line
                </h1>
                <p className="text-sm text-ink-secondary mt-1">
                  Set your 6-digit TikCredit Security PIN to authorize loan applications and sensitive account updates.
                </p>
              </div>

              <div className="bg-inverse text-ink-inverse rounded-2xl p-5 space-y-2">
                <p className="text-xs text-ink-inverse-muted">
                  Approved Revolving Credit Line · Starts at ₱0.00 Used
                </p>
                <p className="font-mono tabular-nums text-3xl font-extrabold text-ink-inverse">
                  {formatPHP(computedLimit)}
                </p>
                <p className="text-xs text-accent">
                  {incomeSource} · {formatPHP(monthlyIncome)}/mo · Instant payout via{' '}
                  {payoutProvider} ••••{' '}
                  {payoutNumber.replace(/\D/g, '').slice(-4) || '5512'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Set 6-Digit Security PIN
                </label>
                <div className="flex items-center bg-canvas border border-line rounded-xl px-4">
                  <Lock className="w-4 h-4 text-ink-secondary mr-2.5 shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setPinError('');
                    }}
                    className="w-full min-h-[48px] bg-transparent font-mono tabular-nums text-lg tracking-widest font-bold text-ink focus:outline-none"
                  />
                </div>
                {pinError && (
                  <p className="text-xs text-danger mt-1">{pinError}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-success">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  ID {nationalId} &amp; Share Capital {formatPHP(shareCapital)} ready for Manager verification
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-canvas hover:bg-subtle text-xs font-semibold text-ink cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="min-h-[50px] px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Onboarding &amp; Enter Wallet</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="w-full max-w-3xl mx-auto text-center text-xs text-ink-muted">
        TikCredit Member Onboarding · Truth in Lending Act Compliant
      </footer>
    </div>
  );
};
