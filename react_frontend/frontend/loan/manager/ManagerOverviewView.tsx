import React from 'react';
import {
  formatPHP,
  InstallmentStatus,
  LoanRequestStatus,
  PlatformState,
  TicketStatus,
} from '../shared/creditData';
import { ManagerTab } from './ManagerWorkspace';

interface ManagerOverviewViewProps {
  state: PlatformState;
  onNavigateTab: (tab: ManagerTab) => void;
}

export const ManagerOverviewView: React.FC<ManagerOverviewViewProps> = ({
  state,
  onNavigateTab,
}) => {
  const pendingLoans = state.loanRequests.filter(
    (r) => r.status === LoanRequestStatus.PENDING
  );
  const approvedLoans = state.loanRequests.filter(
    (r) => r.status === LoanRequestStatus.APPROVED
  );
  const approvedVolume = approvedLoans.reduce((acc, r) => acc + r.principal, 0);

  const openTickets = state.tickets.filter(
    (t) => t.status !== TicketStatus.RESOLVED
  );

  let paidInstallments = 0;
  let totalInstallments = 0;
  for (const plan of state.plans) {
    for (const inst of plan.installments) {
      totalInstallments++;
      if (inst.status === InstallmentStatus.PAID) paidInstallments++;
    }
  }
  const collectionRatePct =
    totalInstallments > 0
      ? Math.round((paidInstallments / totalInstallments) * 100)
      : 100;

  return (
    <div className="space-y-6">
      <section className="bg-inverse text-ink-inverse rounded-3xl p-6 sm:p-8">
        <p className="text-xs text-ink-inverse-muted">
          Metro Manila Lending Hub · Credit Operations Queue
        </p>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-inverse">
              Loan Verification &amp; Member Resolution
            </h1>
            <p className="text-xs text-ink-inverse-subtle mt-1">
              Verify National ID KYC &amp; credit standing, approve pending cash disbursements, and resolve member tickets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('approvals')}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Review {pendingLoans.length} Pending{' '}
            {pendingLoans.length === 1 ? 'Loan' : 'Loans'}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-ink-inverse/10">
          <div>
            <p className="text-xs text-ink-inverse-muted">Pending Approvals</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-ink-inverse mt-0.5">
              {pendingLoans.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Approved Volume</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-accent mt-0.5">
              {formatPHP(approvedVolume)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Open Member Tickets</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-ink-inverse mt-0.5">
              {openTickets.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-inverse-muted">Paid Installment Ratio</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-ink-inverse mt-0.5">
              {collectionRatePct}%
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="font-display text-base font-bold text-ink">
              Awaiting Manager Verification ({pendingLoans.length})
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('approvals')}
              className="text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              Open Full Queue
            </button>
          </div>

          {pendingLoans.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-secondary">
              All submitted Shareholder loan requests have been verified!
            </div>
          ) : (
            <div className="divide-y divide-line">
              {pendingLoans.map((req) => (
                <div
                  key={req.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-ink-secondary font-mono tabular-nums">
                      {req.referenceCode} · {req.applicantName} ({req.applicantHandle})
                    </p>
                    <p className="text-sm font-bold text-ink truncate mt-0.5">
                      {req.purpose}
                    </p>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      {req.applicantProfile} · Share Capital{' '}
                      {formatPHP(req.shareCapitalSnapshot)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono tabular-nums text-sm font-extrabold text-ink">
                      {formatPHP(req.principal)} ({req.tenor}m)
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('approvals')}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-inverse text-ink-inverse text-xs font-semibold cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 bg-surface border border-line rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="font-display text-base font-bold text-ink">
              Open Support &amp; Feedback ({openTickets.length})
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('tickets')}
              className="text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              Manage All
            </button>
          </div>

          {openTickets.length === 0 ? (
            <p className="py-6 text-center text-xs text-ink-secondary">
              No unresolved support tickets.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {openTickets.slice(0, 4).map((tkt) => (
                <div key={tkt.id} className="py-3.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-ink">
                      {tkt.referenceCode} · {tkt.userHandle}
                    </span>
                    <span className="text-brand font-semibold">
                      {tkt.priority}
                    </span>
                  </div>
                  <p className="font-semibold text-ink truncate">
                    {tkt.subject}
                  </p>
                  <p className="text-ink-secondary line-clamp-2">
                    {tkt.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
