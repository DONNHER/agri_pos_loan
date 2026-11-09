import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  Search,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import {
  computeUserCreditSummary,
  CreditPlan,
  formatPHP,
  InstallmentItem,
  InstallmentStatus,
  LedgerEntry,
  LoanRequestStatus,
  PlatformState,
  PlatformUser,
} from '../shared/creditData';

export type BillsSubTab = 'upcoming' | 'plans' | 'history';

export interface BillsFocusTarget {
  subTab: BillsSubTab;
  query?: string;
  nonce: number;
}

interface BillsViewProps {
  state: PlatformState;
  user: PlatformUser;
  balanceMasked: boolean;
  initialFocus?: BillsFocusTarget | null;
  onSubTabChange?: (subTab: BillsSubTab) => void;
  onOpenPayInstallment: (installment: InstallmentItem) => void;
  onEarlySettlePlan: (plan: CreditPlan) => void;
  onOpenReceipt: (entry: LedgerEntry) => void;
  onNavigateCashLoan: () => void;
}

export const BillsView: React.FC<BillsViewProps> = ({
  state,
  user,
  balanceMasked,
  initialFocus,
  onSubTabChange,
  onOpenPayInstallment,
  onEarlySettlePlan,
  onOpenReceipt,
  onNavigateCashLoan,
}) => {
  const [subTab, setSubTab] = useState<BillsSubTab>(
    initialFocus?.subTab || 'upcoming'
  );
  const [searchQuery, setSearchQuery] = useState(initialFocus?.query || '');

  useEffect(() => {
    if (!initialFocus) return;
    setSubTab(initialFocus.subTab);
    setSearchQuery(initialFocus.query ?? '');
  }, [initialFocus?.nonce]);

  useEffect(() => {
    onSubTabChange?.(subTab);
  }, [subTab, onSubTabChange]);

  const summary = computeUserCreditSummary(state, user.id);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredUpcoming = summary.upcomingInstallments.filter(
    (inst) =>
      !normalizedQuery ||
      inst.planTitle.toLowerCase().includes(normalizedQuery) ||
      inst.dueDate.toLowerCase().includes(normalizedQuery)
  );

  const activePlans = summary.userPlans.filter((p) =>
    p.installments.some((i) => i.status === InstallmentStatus.UPCOMING)
  );

  const pendingLoanRequests = summary.userLoanRequests.filter(
    (r) => r.status === LoanRequestStatus.PENDING
  );

  const hasPriorPlans = summary.userPlans.length > 0;

  const filteredPlans = activePlans.filter(
    (p) =>
      !normalizedQuery ||
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.referenceCode.toLowerCase().includes(normalizedQuery) ||
      p.disbursedToOrMerchant.toLowerCase().includes(normalizedQuery)
  );

  const filteredLedger = summary.userLedger.filter(
    (l) =>
      !normalizedQuery ||
      l.title.toLowerCase().includes(normalizedQuery) ||
      l.subtitle.toLowerCase().includes(normalizedQuery) ||
      l.referenceCode.toLowerCase().includes(normalizedQuery) ||
      l.channel.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="space-y-6">
      <section className="bg-surface border border-line rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-xs text-ink-secondary">
            Total Scheduled Balance ({summary.upcomingInstallments.length} open{' '}
            {summary.upcomingInstallments.length === 1
              ? 'installment'
              : 'installments'}
            )
          </p>
          <h1 className="font-mono tabular-nums text-3xl sm:text-4xl font-extrabold text-ink">
            {formatPHP(summary.totalOutstandingWithInterest, balanceMasked)}
          </h1>
          <p className="text-xs text-ink-secondary">
            Statement every {user.statementDay}th of the month · Instant credit restoration upon settlement
          </p>
        </div>

        {summary.nextInstallment && (
          <button
            type="button"
            onClick={() => onOpenPayInstallment(summary.nextInstallment!)}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover active:scale-[0.98] transition-all text-on-brand font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              Pay Next Due ({formatPHP(summary.nextInstallment.totalDue)})
            </span>
          </button>
        )}
      </section>

      <section className="bg-surface border border-line rounded-3xl p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div
            className="flex items-center gap-1 p-1 bg-subtle rounded-xl self-start"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'upcoming'}
              onClick={() => setSubTab('upcoming')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'upcoming'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Upcoming ({summary.upcomingInstallments.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'plans'}
              onClick={() => setSubTab('plans')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'plans'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Active Plans ({activePlans.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'history'}
              onClick={() => setSubTab('history')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'history'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Ledger ({summary.userLedger.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bill, reference, wallet..."
              aria-label="Search bills and ledger"
              className="w-full min-h-[44px] pl-10 pr-9 py-2 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {subTab === 'upcoming' && (
          <div>
            {filteredUpcoming.length === 0 ? (
              normalizedQuery ? (
                <div className="py-12 text-center space-y-2">
                  <p className="font-display text-base font-bold text-ink">
                    No matching installments
                  </p>
                  <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                    Try clearing your search filter to view scheduled bills.
                  </p>
                </div>
              ) : pendingLoanRequests.length > 0 && !hasPriorPlans ? (
                <div className="py-12 text-center space-y-3">
                  <Clock className="w-8 h-8 text-warning mx-auto" />
                  <p className="font-display text-base font-bold text-ink">
                    First loan request awaiting Manager approval
                  </p>
                  <p className="text-xs text-ink-secondary max-w-md mx-auto">
                    Your {formatPHP(pendingLoanRequests[0].principal)} loan
                    request ({pendingLoanRequests[0].referenceCode}) is under
                    verification. Monthly installments will appear here as soon
                    as funds are disbursed.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateCashLoan}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-inverse text-ink-inverse text-xs font-semibold cursor-pointer"
                  >
                    View Application Status
                  </button>
                </div>
              ) : !hasPriorPlans ? (
                <div className="py-12 text-center space-y-3">
                  <Wallet className="w-8 h-8 text-brand mx-auto" />
                  <p className="font-display text-base font-bold text-ink">
                    No loan records yet
                  </p>
                  <p className="text-xs text-ink-secondary max-w-md mx-auto">
                    Your revolving credit line ({formatPHP(summary.availableCredit)}{' '}
                    available) is active with ₱0.00 scheduled balance. Apply for
                    your first cash loan to generate an installment schedule.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateCashLoan}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Apply for First Cash Loan
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
                  <p className="font-display text-base font-bold text-ink">
                    All scheduled installments paid
                  </p>
                  <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                    Approved loans from your Manager will automatically generate
                    their installment schedule here.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateCashLoan}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-inverse text-ink-inverse text-xs font-semibold cursor-pointer"
                  >
                    Request a New Loan
                  </button>
                </div>
              )
            ) : (
              <div className="divide-y divide-line">
                {filteredUpcoming.map((inst) => (
                  <div
                    key={inst.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-ink-secondary">
                        <span className="inline-flex items-center gap-1 font-medium text-warning">
                          <CalendarClock className="w-3.5 h-3.5" />
                          Due {inst.dueDate}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Cash Loan</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {inst.sequence}/{inst.totalSequence}
                        </span>
                      </div>
                      <h3 className="font-display text-sm sm:text-base font-bold text-ink truncate">
                        {inst.planTitle}
                      </h3>
                      <p className="text-xs text-ink-secondary font-mono tabular-nums">
                        Principal {formatPHP(inst.principalPart)} + Interest{' '}
                        {formatPHP(inst.interestPart)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <span className="font-mono tabular-nums text-base sm:text-lg font-extrabold text-ink">
                        {formatPHP(inst.totalDue, balanceMasked)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenPayInstallment(inst)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        Pay Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === 'plans' && (
          <div className="space-y-4">
            {filteredPlans.length === 0 ? (
              <div className="py-10 text-center space-y-1.5">
                <p className="text-sm font-semibold text-ink">
                  {hasPriorPlans
                    ? 'No active credit plans open right now'
                    : 'No active credit plans yet'}
                </p>
                <p className="text-xs text-ink-secondary max-w-md mx-auto">
                  {pendingLoanRequests.length > 0 && !hasPriorPlans
                    ? `Pending loan ${pendingLoanRequests[0].referenceCode} will convert into an active plan immediately upon Manager approval.`
                    : 'Disbursed cash loans appear here with ₱0.00 fee early principal settlement.'}
                </p>
              </div>
            ) : (
              filteredPlans.map((plan) => {
                const unpaid = plan.installments.filter(
                  (i) => i.status === InstallmentStatus.UPCOMING
                );
                const paidCount = plan.installments.length - unpaid.length;
                const remainingPrincipal = unpaid.reduce(
                  (acc, i) => acc + i.principalPart,
                  0
                );
                const waivedInterest = unpaid.reduce(
                  (acc, i) => acc + i.interestPart,
                  0
                );
                return (
                  <div
                    key={plan.id}
                    className="bg-canvas rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                      <div>
                        <p className="text-xs text-ink-secondary font-mono tabular-nums">
                          {plan.referenceCode} · {plan.disbursedToOrMerchant} ·{' '}
                          {plan.createdAt}
                        </p>
                        <h3 className="font-display text-base font-bold text-ink mt-0.5">
                          {plan.title}
                        </h3>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-ink-secondary">
                          {paidCount}/{plan.tenor} installments paid
                        </p>
                        <p className="font-mono tabular-nums text-sm font-bold text-ink">
                          Principal Remaining: {formatPHP(remainingPrincipal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-ink-secondary">
                        {waivedInterest > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-success font-medium">
                            <Sparkles className="w-3.5 h-3.5" />
                            Early payoff waives {formatPHP(waivedInterest)} in future interest
                          </span>
                        ) : (
                          <span>0.00% Promo Plan · Zero future interest</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onEarlySettlePlan(plan)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-surface hover:bg-subtle border border-line text-ink text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        Settle Full Principal ({formatPHP(remainingPrincipal)})
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {subTab === 'history' && (
          <div className="divide-y divide-line">
            {filteredLedger.length === 0 ? (
              <div className="py-10 text-center space-y-1.5">
                <p className="text-sm font-semibold text-ink">
                  {normalizedQuery
                    ? 'No matching ledger entries'
                    : 'No transaction records yet'}
                </p>
                <p className="text-xs text-ink-secondary max-w-md mx-auto">
                  {normalizedQuery
                    ? 'Adjust or clear your search filter to view past receipts.'
                    : 'Official receipts for approved loan disbursements and installment repayments are recorded here.'}
                </p>
              </div>
            ) : (
              filteredLedger.map((entry) => {
                const isRepayment = entry.direction === 'REPAYMENT';
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onOpenReceipt(entry)}
                    className="w-full min-h-[64px] py-3.5 flex items-center justify-between gap-4 text-left hover:bg-canvas -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-ink-secondary font-mono tabular-nums">
                        <span>{entry.referenceCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{entry.channel}</span>
                      </div>
                      <p className="text-sm font-semibold text-ink truncate mt-0.5">
                        {entry.title} — {entry.subtitle}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {entry.timestamp}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-mono tabular-nums text-sm font-bold whitespace-nowrap ${
                          isRepayment ? 'text-success' : 'text-ink'
                        }`}
                      >
                        {isRepayment ? '-' : '+'}
                        {formatPHP(entry.amount, balanceMasked)}
                      </span>
                      <Receipt className="w-4 h-4 text-ink-muted" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
};
