import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Plus,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  calculateLoanQuote,
  computeUserCreditSummary,
  formatPHP,
  LoanRequestItem,
  LoanRequestStatus,
  PlanType,
  PlatformState,
  PlatformUser,
  TENOR_OPTIONS,
  TenorMonths,
} from '../shared/creditData';

interface CashLoanViewProps {
  state: PlatformState;
  user: PlatformUser;
  onRequestCashLoan: (
    amount: number,
    tenor: TenorMonths,
    channelId: string,
    purpose: string
  ) => void;
  onInspectLoanRequest: (req: LoanRequestItem) => void;
  onOpenAddChannel: () => void;
  onNavigateBills: () => void;
}

export const CashLoanView: React.FC<CashLoanViewProps> = ({
  state,
  user,
  onRequestCashLoan,
  onInspectLoanRequest,
  onOpenAddChannel,
  onNavigateBills,
}) => {
  const summary = computeUserCreditSummary(state, user.id);
  const [amountInput, setAmountInput] = useState<number>(() =>
    Math.min(12000, Math.max(1000, summary.availableCredit))
  );
  const [tenor, setTenor] = useState<TenorMonths>(6);
  const defaultChannel =
    user.channels.find((c) => c.isDefault) || user.channels[0];
  const [channelId, setChannelId] = useState<string>(defaultChannel?.id || '');
  const activeChannelId = user.channels.some((c) => c.id === channelId)
    ? channelId
    : defaultChannel?.id || '';
  const [loanPurpose, setLoanPurpose] = useState<string>(
    'Personal Cash & Bill Consolidation'
  );

  const safeAmount = Math.min(
    Math.max(1000, amountInput),
    Math.max(1000, summary.availableCredit)
  );

  const quote = calculateLoanQuote(
    safeAmount,
    tenor,
    PlanType.CASH_LOAN,
    user.statementDay
  );

  const purposes = [
    'Personal Cash & Bill Consolidation',
    'Home Office Laptop & Workspace Upgrade',
    'Medical & Emergency Cash Buffer',
    'Small Business Working Capital',
    'Tuition & Professional Upskilling',
  ];

  return (
    <div className="space-y-6">
      {summary.availableCredit < 1000 ? (
        <div className="bg-surface border border-line rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Available Credit Below Minimum (₱1,000)
          </h1>
          <p className="text-sm text-ink-secondary">
            You currently have {formatPHP(summary.availableCredit)} unreserved.
            Pay an installment or wait for pending Manager review to unlock
            additional principal.
          </p>
          <button
            type="button"
            onClick={onNavigateBills}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-brand text-on-brand text-sm font-semibold cursor-pointer"
          >
            Go to Pay &amp; Bills
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Loan Request Builder */}
          <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="pb-5 border-b border-line flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-brand">
                  Instant Revolving Cash Credit
                </p>
                <h1 className="font-display text-2xl font-extrabold text-ink mt-0.5">
                  Submit Cash Loan Request
                </h1>
              </div>
              <span className="text-xs font-mono tabular-nums text-ink-secondary">
                Available: {formatPHP(summary.availableCredit)}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="cash-loan-number"
                  className="text-xs font-medium text-ink-secondary"
                >
                  Principal Amount (PHP)
                </label>
                <span className="text-xs text-success font-medium">
                  ₱0.00 Origination Fee
                </span>
              </div>

              <div className="flex items-center bg-canvas border border-line rounded-2xl px-4 py-2 focus-within:border-ink">
                <span className="font-mono text-2xl font-bold text-ink mr-2">
                  ₱
                </span>
                <input
                  id="cash-loan-number"
                  type="number"
                  min={1000}
                  max={summary.availableCredit}
                  step={500}
                  value={safeAmount}
                  onChange={(e) =>
                    setAmountInput(Number(e.target.value) || 1000)
                  }
                  className="w-full min-h-[48px] bg-transparent font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-ink focus:outline-none"
                />
              </div>

              <input
                type="range"
                aria-label="Adjust loan request amount"
                min={1000}
                max={summary.availableCredit}
                step={500}
                value={safeAmount}
                onChange={(e) => setAmountInput(Number(e.target.value))}
                className="w-full h-2 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
              />
            </div>

            <div className="pt-5 border-t border-line space-y-3">
              <p className="text-xs font-medium text-ink-secondary">
                Select Tenor &amp; Monthly Interest Rate
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {TENOR_OPTIONS.map((m) => {
                  const q = calculateLoanQuote(
                    safeAmount,
                    m,
                    PlanType.CASH_LOAN,
                    user.statementDay
                  );
                  const isSelected = tenor === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTenor(m)}
                      className={`min-h-[60px] p-3 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-inverse text-ink-inverse'
                          : 'bg-canvas text-ink hover:bg-subtle'
                      }`}
                    >
                      <p className="text-xs font-bold whitespace-nowrap">
                        {m === 1 ? '1 Month' : `${m} Months`}
                      </p>
                      <p
                        className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                          isSelected ? 'text-accent' : 'text-ink-secondary'
                        }`}
                      >
                        {q.monthlyRatePct.toFixed(2)}%/mo
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-5 border-t border-line space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-ink-secondary">
                  Disbursement Channel (Upon Manager Approval)
                </p>
                <button
                  type="button"
                  onClick={onOpenAddChannel}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-ink cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Account</span>
                </button>
              </div>
              {user.channels.length === 0 ? (
                <div className="bg-canvas rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-ink-secondary">
                    No payout wallet linked yet. Link GCash, Maya, or a bank account to receive loan proceeds.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAddChannel}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-inverse text-ink-inverse text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Link Payout Wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.channels.map((ch) => {
                    const active = ch.id === activeChannelId;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setChannelId(ch.id)}
                        className={`w-full min-h-[54px] px-4 py-3 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          active
                            ? 'bg-inverse text-ink-inverse'
                            : 'bg-canvas text-ink hover:bg-subtle'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 text-left">
                          <Wallet
                            className={`w-4 h-4 shrink-0 ${
                              active ? 'text-accent' : 'text-ink-secondary'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {ch.provider} · {ch.accountMask}
                            </p>
                            <p
                              className={`text-xs truncate ${
                                active
                                  ? 'text-ink-inverse-subtle'
                                  : 'text-ink-secondary'
                              }`}
                            >
                              {ch.accountHolder}
                            </p>
                          </div>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-5 border-t border-line space-y-3">
              <p className="text-xs font-medium text-ink-secondary">
                Loan Purpose
              </p>
              <div className="flex flex-wrap gap-2">
                {purposes.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLoanPurpose(p)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      loanPurpose === p
                        ? 'bg-inverse text-ink-inverse'
                        : 'bg-canvas text-ink-secondary hover:text-ink'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Right 5 Cols: Amortization Preview & Submit */}
          <section className="lg:col-span-5 bg-surface border border-line rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-line">
              <h2 className="font-display text-lg font-bold text-ink">
                Truth-in-Lending Schedule
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Sent to Loan Manager for KYC &amp; credit standing verification
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Net Proceeds on Approval</span>
                <span className="font-mono tabular-nums font-bold text-base text-success">
                  {formatPHP(quote.principal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Monthly Principal</span>
                <span className="font-mono tabular-nums text-ink">
                  {formatPHP(quote.monthlyPrincipal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">
                  Monthly Interest ({quote.monthlyRatePct.toFixed(2)}%)
                </span>
                <span className="font-mono tabular-nums text-ink">
                  {formatPHP(quote.monthlyInterest)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-line">
                <span className="font-semibold text-ink">
                  Total Scheduled Repayment
                </span>
                <span className="font-mono tabular-nums text-base font-extrabold text-ink">
                  {formatPHP(quote.totalRepayment)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-line">
              <p className="text-xs font-semibold text-ink mb-3">
                Projected Installments ({quote.tenor})
              </p>
              <div className="max-h-52 overflow-y-auto divide-y divide-line pr-1">
                {quote.scheduleDates.map((dateStr, idx) => (
                  <div
                    key={dateStr}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <span className="text-ink-secondary">
                      <strong className="font-mono text-ink">
                        {idx + 1}/{quote.tenor}
                      </strong>{' '}
                      · {dateStr}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-ink">
                      {formatPHP(quote.monthlyInstallment)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-ink-secondary">
              <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>
                Submitting reserves {formatPHP(quote.principal)} from your
                credit line until reviewed by your Loan Manager or Admin.
              </span>
            </div>

            <button
              type="button"
              disabled={!activeChannelId}
              onClick={() =>
                onRequestCashLoan(
                  safeAmount,
                  tenor,
                  activeChannelId,
                  loanPurpose
                )
              }
              className="w-full min-h-[52px] px-5 py-3.5 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all text-on-brand font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Authorize Request with 6-Digit PIN</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </section>
        </div>
      )}

      {/* Loan Application History & Live Verification Status */}
      <section className="bg-surface border border-line rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-line">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              My Loan Applications ({summary.userLoanRequests.length})
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Track pending Manager verification, approved disbursements, and past requests
            </p>
          </div>
          {summary.reservedPendingPrincipal > 0 && (
            <span className="font-mono tabular-nums text-xs font-semibold text-warning">
              Pending Reserve: {formatPHP(summary.reservedPendingPrincipal)}
            </span>
          )}
        </div>

        {summary.userLoanRequests.length === 0 ? (
          <div className="py-6 text-center space-y-1">
            <p className="text-sm font-semibold text-ink">
              No loan applications on record yet
            </p>
            <p className="text-xs text-ink-secondary max-w-md mx-auto">
              Once you authorize your first cash loan request above, its live Loan Manager underwriting status and disbursement details will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {summary.userLoanRequests.map((req) => {
              const isApproved = req.status === LoanRequestStatus.APPROVED;
              const isRejected = req.status === LoanRequestStatus.REJECTED;
              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => onInspectLoanRequest(req)}
                  className="w-full min-h-[64px] py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-canvas -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary font-mono tabular-nums">
                      <span className="font-semibold text-ink">
                        {req.referenceCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {req.tenor === 1 ? '1 Month' : `${req.tenor} Months`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{req.disbursementChannel}</span>
                    </div>
                    <p className="text-sm font-semibold text-ink truncate">
                      {req.purpose}
                    </p>
                    <p className="text-xs text-ink-muted">{req.createdAt}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${
                        isApproved
                          ? 'text-success'
                          : isRejected
                          ? 'text-danger'
                          : 'text-warning'
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isRejected ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isApproved
                          ? 'Approved & Disbursed'
                          : isRejected
                          ? 'Declined'
                          : 'Pending Manager Review'}
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-sm sm:text-base font-extrabold text-ink whitespace-nowrap">
                      {formatPHP(req.principal)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
