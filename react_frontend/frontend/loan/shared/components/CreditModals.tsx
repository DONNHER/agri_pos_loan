import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Delete,
  Lock,
  ShieldCheck,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import {
  formatPHP,
  InstallmentItem,
  LedgerEntry,
  LinkedChannel,
  LoanRequestItem,
  LoanRequestStatus,
  PlatformUser,
  UserRole,
} from '../creditData';

/* 1. 6-Digit Security PIN Sheet */
interface PinVerificationModalProps {
  isOpen: boolean;
  expectedPin: string;
  actionSummary: string;
  amountLabel: string;
  onClose: () => void;
  onVerified: () => void;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  expectedPin,
  actionSummary,
  amountLabel,
  onClose,
  onVerified,
}) => {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEntered('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Backspace') {
        setEntered((prev) => prev.slice(0, -1));
        setError('');
      } else if (/^\d$/.test(e.key)) {
        setEntered((prev) => {
          if (prev.length >= 6) return prev;
          const next = prev + e.key;
          if (next.length === 6) {
            if (next === expectedPin) {
              setTimeout(() => onVerified(), 90);
            } else {
              setError(`Incorrect PIN. Demo PIN is ${expectedPin}.`);
              return '';
            }
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, expectedPin, onClose, onVerified]);

  if (!isOpen) return null;

  const pushDigit = (digit: string) => {
    setError('');
    if (entered.length >= 6) return;
    const next = entered + digit;
    setEntered(next);
    if (next.length === 6) {
      if (next === expectedPin) {
        setTimeout(() => onVerified(), 90);
      } else {
        setError(`Incorrect PIN. Try ${expectedPin}.`);
        setEntered('');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Enter 6-digit TikCredit Security PIN"
    >
      <div className="w-full sm:max-w-sm bg-surface rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
        <div className="w-10 h-1.5 bg-line rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Lock className="w-4 h-4 text-brand" />
            <span>TikCredit Security PIN</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close PIN verification"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-secondary hover:text-ink cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-ink-secondary">{actionSummary}</p>
          <p className="font-mono tabular-nums text-2xl font-extrabold text-ink">
            {amountLabel}
          </p>
          <p className="text-[11px] text-ink-muted font-mono tabular-nums">
            Enter 6-digit PIN (Demo PIN: {expectedPin})
          </p>
        </div>

        <div className="grid grid-cols-6 gap-2 max-w-[260px] mx-auto">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const filled = i < entered.length;
            return (
              <div
                key={i}
                className={`h-11 rounded-xl border flex items-center justify-center font-mono text-lg font-bold ${
                  filled
                    ? 'border-ink bg-canvas text-ink'
                    : 'border-line bg-canvas text-transparent'
                }`}
              >
                •
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-center font-medium text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => pushDigit(d)}
              className="min-h-[52px] rounded-xl bg-canvas hover:bg-subtle active:scale-[0.97] font-mono tabular-nums text-lg font-bold text-ink transition-all cursor-pointer"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setEntered(expectedPin.slice(0, 5));
              pushDigit(expectedPin.slice(5));
            }}
            className="min-h-[52px] rounded-xl bg-brand-soft hover:bg-brand-tint text-xs font-semibold text-brand cursor-pointer"
          >
            Auto-Fill
          </button>
          <button
            type="button"
            onClick={() => pushDigit('0')}
            className="min-h-[52px] rounded-xl bg-canvas hover:bg-subtle active:scale-[0.97] font-mono tabular-nums text-lg font-bold text-ink transition-all cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setEntered((prev) => prev.slice(0, -1))}
            aria-label="Backspace"
            className="min-h-[52px] rounded-xl bg-canvas hover:bg-subtle flex items-center justify-center text-ink cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* 2. Bill Repayment Channel Sheet */
interface RepaymentModalProps {
  installment: InstallmentItem | null;
  channels: LinkedChannel[];
  onClose: () => void;
  onConfirmPayment: (installmentId: string, channelLabel: string) => void;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  installment,
  channels,
  onClose,
  onConfirmPayment,
}) => {
  const defaultCh = channels.find((c) => c.isDefault) || channels[0];
  const [selectedLabel, setSelectedLabel] = useState<string>(
    defaultCh
      ? `${defaultCh.provider} ${defaultCh.accountMask}`
      : 'GCash •••• 4821'
  );

  useEffect(() => {
    if (defaultCh) {
      setSelectedLabel(`${defaultCh.provider} ${defaultCh.accountMask}`);
    }
  }, [defaultCh]);

  if (!installment) return null;

  const extraChannels = ['QRPh Instant Transfer', 'InstaPay Over-the-Counter'];

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Repay Installment"
    >
      <div className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
        <div className="w-10 h-1.5 bg-line rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <p className="text-xs text-ink-secondary">Installment Payment</p>
            <h2 className="font-display text-lg font-bold text-ink">
              Pay Installment {installment.sequence}/{installment.totalSequence}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close repayment modal"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-canvas rounded-2xl p-4 space-y-1">
          <p className="text-xs text-ink-secondary truncate">{installment.planTitle}</p>
          <p className="font-mono tabular-nums text-2xl font-extrabold text-ink">
            {formatPHP(installment.totalDue)}
          </p>
          <p className="text-xs text-success font-medium">
            Restores +{formatPHP(installment.principalPart)} to Available Credit
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-secondary">Select Payment Channel</p>
          {channels.map((ch) => {
            const label = `${ch.provider} ${ch.accountMask}`;
            const active = selectedLabel === label;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedLabel(label)}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-inverse text-ink-inverse'
                    : 'bg-canvas text-ink hover:bg-subtle'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span>{label}</span>
                </span>
                {active && <CheckCircle2 className="w-4 h-4 text-accent" />}
              </button>
            );
          })}
          {extraChannels.map((label) => {
            const active = selectedLabel === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedLabel(label)}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-inverse text-ink-inverse'
                    : 'bg-canvas text-ink hover:bg-subtle'
                }`}
              >
                <span>{label}</span>
                {active && <CheckCircle2 className="w-4 h-4 text-accent" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onConfirmPayment(installment.id, selectedLabel)}
          className="w-full min-h-[50px] px-5 py-3.5 rounded-xl bg-brand hover:bg-brand-hover text-on-brand font-semibold text-sm whitespace-nowrap cursor-pointer"
        >
          Confirm Payment · {formatPHP(installment.totalDue)}
        </button>
      </div>
    </div>
  );
};

/* 3. Digital Receipt Modal */
interface ReceiptModalProps {
  entry: LedgerEntry | null;
  onClose: () => void;
  onOpenLedger?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  entry,
  onClose,
  onOpenLedger,
}) => {
  if (!entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Digital Receipt"
    >
      <div className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <span className="font-display text-base font-bold text-ink">
            TikCredit Digital Receipt
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center py-2 space-y-1">
          <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-1" />
          <p className="text-xs text-ink-secondary">{entry.title}</p>
          <p className="font-mono tabular-nums text-3xl font-extrabold text-ink">
            {formatPHP(entry.amount)}
          </p>
          <p className="text-xs text-success font-medium">Completed · Verified</p>
        </div>

        <div className="bg-canvas rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-ink-secondary">Reference ID</span>
            <span className="font-mono tabular-nums font-semibold text-ink">
              {entry.referenceCode}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-secondary">Description</span>
            <span className="font-medium text-ink text-right">
              {entry.subtitle}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-secondary">Channel</span>
            <span className="font-mono tabular-nums text-ink">
              {entry.channel}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-secondary">Timestamp</span>
            <span className="font-mono tabular-nums text-ink">
              {entry.timestamp}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {onOpenLedger && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLedger();
              }}
              className="flex-1 min-h-[46px] px-4 rounded-xl bg-canvas hover:bg-subtle text-ink text-xs font-semibold cursor-pointer transition-colors"
            >
              Open in Pay &amp; Bills Ledger
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[46px] px-4 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* 4. Add Linked Account, Change PIN & Edit Profile Modals */
interface AddChannelModalProps {
  isOpen: boolean;
  defaultHolder: string;
  onClose: () => void;
  onAdd: (provider: LinkedChannel['provider'], digits: string, holder: string) => void;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  defaultHolder,
  onClose,
  onAdd,
}) => {
  const [provider, setProvider] = useState<LinkedChannel['provider']>('BPI');
  const [accountNumber, setAccountNumber] = useState('09178293011');
  const [holder, setHolder] = useState(defaultHolder);

  useEffect(() => {
    setHolder(defaultHolder);
  }, [defaultHolder]);

  if (!isOpen) return null;

  const providers: LinkedChannel['provider'][] = [
    'GCash',
    'Maya',
    'GoTyme Bank',
    'BPI',
    'BDO',
    'UnionBank',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const last4 = accountNumber.replace(/\D/g, '').slice(-4) || '7721';
    onAdd(provider, last4, holder.trim() || defaultHolder);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Link New Payout Account"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <h2 className="font-display text-base font-bold text-ink">
            Link E-Wallet or Bank
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="text-xs font-medium text-ink-secondary mb-2">Provider</p>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  provider === p
                    ? 'bg-inverse text-ink-inverse'
                    : 'bg-canvas text-ink-secondary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">
            Account or Mobile Number
          </label>
          <input
            type="text"
            required
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums text-ink focus:outline-none focus:border-ink"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">
            Account Holder Name
          </label>
          <input
            type="text"
            required
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
          />
        </div>

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-sm font-semibold cursor-pointer"
        >
          Save Linked Account
        </button>
      </form>
    </div>
  );
};

interface ChangePinModalProps {
  isOpen: boolean;
  currentPin: string;
  onClose: () => void;
  onSavePin: (newPin: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  currentPin,
  onClose,
  onSavePin,
}) => {
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) {
      setError('Enter exactly 6 numeric digits.');
      return;
    }
    onSavePin(newPin);
    setNewPin('');
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Update 6-Digit PIN"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-sm bg-surface rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <h2 className="font-display text-base font-bold text-ink">
            Update 6-Digit PIN
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-ink-secondary">
          Current active PIN:{' '}
          <span className="font-mono font-semibold">{currentPin}</span>
        </p>

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">
            New 6-Digit Numeric PIN
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={newPin}
            onChange={(e) => {
              setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6));
              setError('');
            }}
            placeholder="e.g. 654321"
            className="w-full min-h-[48px] px-4 py-2 bg-canvas border border-line rounded-xl font-mono tabular-nums text-lg tracking-widest text-ink focus:outline-none focus:border-ink"
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-xl bg-inverse text-ink-inverse text-sm font-semibold cursor-pointer"
        >
          Update Security PIN
        </button>
      </form>
    </div>
  );
};

interface EditProfileModalProps {
  isOpen: boolean;
  user: PlatformUser;
  onClose: () => void;
  onSaveProfile: (updated: {
    fullName: string;
    handle: string;
    phone: string;
    cityAddress: string;
    incomeSource: string;
    departmentOrBranch?: string;
  }) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onSaveProfile,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [handle, setHandle] = useState(user.handle);
  const [phone, setPhone] = useState(user.phone);
  const [cityAddress, setCityAddress] = useState(user.cityAddress);
  const [incomeSource, setIncomeSource] = useState(user.incomeSource);
  const [dept, setDept] = useState(user.departmentOrBranch || '');

  useEffect(() => {
    setFullName(user.fullName);
    setHandle(user.handle);
    setPhone(user.phone);
    setCityAddress(user.cityAddress);
    setIncomeSource(user.incomeSource);
    setDept(user.departmentOrBranch || '');
  }, [user]);

  if (!isOpen) return null;

  const isShareholder = user.role === UserRole.SHAREHOLDER;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      fullName: fullName.trim() || user.fullName,
      handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      phone: phone.trim() || user.phone,
      cityAddress: cityAddress.trim() || user.cityAddress,
      incomeSource: incomeSource.trim() || user.incomeSource,
      departmentOrBranch: dept.trim() || user.departmentOrBranch,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Account Profile"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <h2 className="font-display text-base font-bold text-ink">
            Edit Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Handle
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-sm font-mono tabular-nums text-ink focus:outline-none focus:border-ink"
            />
          </div>
        </div>

        {isShareholder ? (
          <>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">
                City / Residence Address
              </label>
              <input
                type="text"
                value={cityAddress}
                onChange={(e) => setCityAddress(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">
                Employment / Income Source
              </label>
              <input
                type="text"
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Branch / Department Assignment
            </label>
            <input
              type="text"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-xl bg-inverse text-ink-inverse text-sm font-semibold cursor-pointer"
        >
          Save Profile Changes
        </button>
      </form>
    </div>
  );
};

/* 5. Loan Application Detail Modal (Opened from Clickable Notifications & Loan Status Rows) */
interface LoanRequestDetailModalProps {
  request: LoanRequestItem | null;
  onClose: () => void;
  onOpenActivePlans?: () => void;
  onOpenSupportTickets?: (relatedLoanRef: string) => void;
}

export const LoanRequestDetailModal: React.FC<LoanRequestDetailModalProps> = ({
  request,
  onClose,
  onOpenActivePlans,
  onOpenSupportTickets,
}) => {
  if (!request) return null;

  const isPending = request.status === LoanRequestStatus.PENDING;
  const isApproved = request.status === LoanRequestStatus.APPROVED;
  const checklist = request.checklist || {
    kycVerified: false,
    shareCapitalChecked: false,
    repaymentCapacityChecked: false,
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Loan Application Details"
    >
      <div className="w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1.5 bg-line rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <p className="text-xs font-mono tabular-nums text-ink-secondary">
              {request.referenceCode} · {request.createdAt}
            </p>
            <h2 className="font-display text-lg font-bold text-ink">
              Loan Application Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close loan details"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-secondary hover:text-ink cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center py-1 space-y-1">
          {isPending ? (
            <Clock className="w-7 h-7 text-warning mx-auto mb-1" />
          ) : isApproved ? (
            <CheckCircle2 className="w-7 h-7 text-success mx-auto mb-1" />
          ) : (
            <XCircle className="w-7 h-7 text-danger mx-auto mb-1" />
          )}
          <p className="text-xs text-ink-secondary">{request.purpose}</p>
          <p className="font-mono tabular-nums text-3xl font-extrabold text-ink">
            {formatPHP(request.principal)}
          </p>
          <p
            className={`text-xs font-semibold ${
              isPending
                ? 'text-warning'
                : isApproved
                ? 'text-success'
                : 'text-danger'
            }`}
          >
            {isPending
              ? 'Pending Loan Manager Verification'
              : isApproved
              ? 'Approved & Disbursed'
              : 'Declined'}
          </p>
        </div>

        <div className="bg-canvas rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-ink-secondary">Applicant</span>
            <span className="font-medium text-ink text-right">
              {request.applicantName} ({request.applicantHandle})
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-secondary">Installment Plan</span>
            <span className="font-mono tabular-nums font-semibold text-ink">
              {request.tenor} mos · {formatPHP(request.monthlyInstallment)}/mo (
              {request.monthlyRatePct.toFixed(2)}%)
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-secondary">Total Scheduled Repayment</span>
            <span className="font-mono tabular-nums font-semibold text-ink">
              {formatPHP(request.totalRepayment)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-secondary">Payout Channel</span>
            <span className="font-mono tabular-nums text-ink">
              {request.disbursementChannel}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink">
            Underwriting Verification Checklist
          </p>
          <div className="divide-y divide-line border border-line rounded-2xl px-4">
            {(
              [
                {
                  done: checklist.kycVerified,
                  label: 'Government National ID & KYC Verified',
                },
                {
                  done: checklist.shareCapitalChecked,
                  label: 'Paid-Up Share Capital Standing Confirmed',
                },
                {
                  done: checklist.repaymentCapacityChecked,
                  label: 'Monthly Debt-to-Income Capacity Verified',
                },
              ] as const
            ).map((step) => (
              <div
                key={step.label}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <span className="flex items-center gap-2 text-ink">
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      step.done ? 'text-success' : 'text-ink-muted'
                    }`}
                  />
                  <span>{step.label}</span>
                </span>
                <span
                  className={`font-semibold whitespace-nowrap ${
                    step.done ? 'text-success' : 'text-warning'
                  }`}
                >
                  {step.done ? 'Verified' : 'In Queue'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {request.reviewNote && (
          <div className="bg-canvas rounded-2xl p-3.5 text-xs space-y-1">
            <p className="font-semibold text-ink">
              Underwriting Note
              {request.reviewedBy ? ` · ${request.reviewedBy}` : ''}
            </p>
            <p className="text-ink-secondary leading-relaxed">
              “{request.reviewNote}”
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5">
          {isApproved && onOpenActivePlans ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenActivePlans();
              }}
              className="flex-1 min-h-[46px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Open Active Plan in Pay &amp; Bills</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : onOpenSupportTickets ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSupportTickets(request.referenceCode);
              }}
              className="flex-1 min-h-[46px] px-4 rounded-xl bg-canvas hover:bg-subtle text-ink text-xs font-semibold cursor-pointer transition-colors"
            >
              Inquire in Support Tickets
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[46px] px-4 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
