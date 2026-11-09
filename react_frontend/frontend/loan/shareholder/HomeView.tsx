import React from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  computeUserCreditSummary,
  formatPHP,
  InstallmentStatus,
  LoanRequestStatus,
  PlatformState,
  PlatformUser,
} from '../shared/creditData';

interface HomeViewProps {
  state: PlatformState;
  user: PlatformUser;
  balanceMasked: boolean;
  onToggleMask: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  user,
  balanceMasked,
  onToggleMask,
}) => {
  const summary = computeUserCreditSummary(state, user.id);

  const activePlansCount = summary.userPlans.filter((p) =>
    p.installments.some((i) => i.status === InstallmentStatus.UPCOMING)
  ).length;

  const pendingLoanRequests = summary.userLoanRequests.filter(
    (r) => r.status === LoanRequestStatus.PENDING
  );

  const hasAnyLoanRecord =
    summary.userPlans.length > 0 || summary.userLoanRequests.length > 0;

  const defaultChannel =
    user.channels.find((c) => c.isDefault) || user.channels[0];

  const completedBoosts = user.boostTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Top Focal Anchor: Shareholder Revolving Credit Line Overview */}
      <section
        aria-label="Credit Line Summary"
        className="bg-inverse text-ink-inverse rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-inverse-muted">
            <span>Revolving Personal &amp; Shareholder Credit Line</span>
            <span aria-hidden="true">·</span>
            <span>{user.accountId}</span>
            <span aria-hidden="true">·</span>
            <span>ID {user.nationalId}</span>
          </div>
          <button
            type="button"
            onClick={onToggleMask}
            aria-label={
              balanceMasked ? 'Show credit amounts' : 'Hide credit amounts'
            }
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-inverse-muted hover:text-ink-inverse transition-colors cursor-pointer"
          >
            {balanceMasked ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="mt-2">
          <p className="text-xs text-ink-inverse-muted">Available Credit</p>
          <p className="font-mono tabular-nums text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-inverse mt-1">
            {formatPHP(summary.availableCredit, balanceMasked)}
          </p>
        </div>

        <div className="mt-6">
          <svg
            viewBox="0 0 100 2"
            preserveAspectRatio="none"
            className="w-full h-2 rounded-full overflow-hidden block"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="creditLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className="[stop-color:var(--theme-accent)]" />
                <stop offset="100%" className="[stop-color:var(--theme-brand)]" />
              </linearGradient>
            </defs>
            <rect
              x="0"
              y="0"
              width="100"
              height="2"
              className="fill-inverse-track"
            />
            <rect
              x="0"
              y="0"
              width={Math.max(3, 100 - summary.utilizationPct)}
              height="2"
              fill="url(#creditLineGrad)"
            />
          </svg>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-inverse-muted">
            <span>
              {user.cityAddress} · {user.incomeSource}
            </span>
            <span className="font-mono tabular-nums text-accent">
              {100 - summary.utilizationPct}% credit unreserved
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-ink-inverse/10">
          <div>
            <p className="text-xs text-ink-inverse-muted">Total Credit Limit</p>
            <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-ink-inverse mt-0.5">
              {formatPHP(summary.totalLimit, balanceMasked)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Active Principal</p>
            <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-ink-inverse mt-0.5">
              {formatPHP(summary.usedPrincipal, balanceMasked)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Pending Verification</p>
            <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-ink-inverse mt-0.5">
              {formatPHP(summary.reservedPendingPrincipal, balanceMasked)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Paid-Up Share Capital</p>
            <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-accent mt-0.5">
              {formatPHP(user.shareCapital, balanceMasked)}
            </p>
          </div>
        </div>
      </section>

      {/* Main 12-Column Overview Grid (Zero redundant Loan Request or Pay actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Statement & Schedule Summary */}
        <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-line">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                Statement &amp; Schedule Summary
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Billing cycle every {user.statementDay}th of the month ·{' '}
                {activePlansCount} active{' '}
                {activePlansCount === 1 ? 'credit plan' : 'credit plans'}
              </p>
            </div>
            {defaultChannel && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary font-mono tabular-nums">
                <Wallet className="w-3.5 h-3.5 text-ink" />
                <span>
                  {defaultChannel.provider} {defaultChannel.accountMask}
                </span>
              </span>
            )}
          </div>

          {summary.nextInstallment ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-warning font-medium">
                  <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                  <span>Next Due · {summary.nextInstallment.dueDate}</span>
                </div>
                <p className="font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-ink">
                  {formatPHP(summary.nextInstallment.totalDue, balanceMasked)}
                </p>
                <p className="text-xs text-ink-secondary truncate">
                  {summary.nextInstallment.planTitle} (
                  {summary.nextInstallment.sequence}/
                  {summary.nextInstallment.totalSequence})
                </p>
              </div>

              <div className="sm:border-l sm:border-line sm:pl-6 space-y-1">
                <p className="text-xs text-ink-secondary">
                  Total Scheduled Balance (
                  {summary.upcomingInstallments.length} open)
                </p>
                <p className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-ink">
                  {formatPHP(
                    summary.totalOutstandingWithInterest,
                    balanceMasked
                  )}
                </p>
                <p className="text-xs text-success">
                  Principal payments restore credit immediately
                </p>
              </div>
            </div>
          ) : pendingLoanRequests.length > 0 ? (
            <div className="py-2 flex items-start gap-3">
              <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-display text-sm font-bold text-ink">
                  {pendingLoanRequests.length === 1
                    ? 'Loan application awaiting Manager verification'
                    : `${pendingLoanRequests.length} loan applications awaiting Manager verification`}
                </p>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  {formatPHP(summary.reservedPendingPrincipal, balanceMasked)} is
                  reserved under review ({pendingLoanRequests[0].referenceCode}).
                  Installments generate automatically once approved &amp; disbursed.
                </p>
              </div>
            </div>
          ) : !hasAnyLoanRecord ? (
            <div className="py-2 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-display text-sm font-bold text-ink">
                  New account · No loan records yet
                </p>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  100% of your {formatPHP(summary.totalLimit, balanceMasked)}{' '}
                  revolving credit line is available with a ₱0.00 statement
                  balance. Use Loan Request in the sidebar whenever you are ready
                  to draw funds.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <div>
                <p className="font-display text-sm font-bold text-ink">
                  No upcoming installments due
                </p>
                <p className="text-xs text-ink-secondary">
                  All prior installments are settled · ₱0.00 balance for the current cycle.
                </p>
              </div>
            </div>
          )}

        </section>

        {/* Right 5 Cols: Account Standing & Credit Terms */}
        <section className="lg:col-span-5 bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="pb-4 border-b border-line">
            <h2 className="font-display text-lg font-bold text-ink">
              Account Standing &amp; Terms
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Verified borrower profile and transparent Truth-in-Lending rates
            </p>
          </div>

          <div className="divide-y divide-line text-xs">
            <div className="py-3 flex items-center justify-between gap-3">
              <span className="text-ink-secondary">Identity Verification</span>
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{user.kycVerified ? 'KYC Verified' : 'Pending KYC'}</span>
              </span>
            </div>
            <div className="py-3 flex items-center justify-between gap-3">
              <span className="text-ink-secondary">Monthly Rate Tier</span>
              <span className="font-mono tabular-nums font-semibold text-ink">
                1.50% – 2.25% / mo
              </span>
            </div>
            <div className="py-3 flex items-center justify-between gap-3">
              <span className="text-ink-secondary">Origination &amp; Early Payoff Fee</span>
              <span className="font-mono tabular-nums font-semibold text-success">
                ₱0.00
              </span>
            </div>
            <div className="py-3 flex items-center justify-between gap-3">
              <span className="text-ink-secondary">Declared Monthly Income</span>
              <span className="font-mono tabular-nums font-semibold text-ink">
                {formatPHP(user.monthlyIncome, balanceMasked)}
              </span>
            </div>
            <div className="py-3 flex items-center justify-between gap-3">
              <span className="text-ink-secondary inline-flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-brand" />
                <span>Credit Boost Milestones</span>
              </span>
              <span className="font-mono tabular-nums font-semibold text-ink">
                {completedBoosts} / {user.boostTasks.length} completed
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
