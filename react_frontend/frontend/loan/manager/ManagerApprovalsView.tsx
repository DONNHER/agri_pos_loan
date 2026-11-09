import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  formatPHP,
  LoanRequestItem,
  LoanRequestStatus,
  PlatformState,
} from '../shared/creditData';

interface ManagerApprovalsViewProps {
  state: PlatformState;
  loanFilter: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  loanSearch: string;
  onChangeLoanFilter: (
    filter: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'
  ) => void;
  onChangeLoanSearch: (search: string) => void;
  onToggleChecklist: (
    requestId: string,
    field: 'kycVerified' | 'shareCapitalChecked' | 'repaymentCapacityChecked'
  ) => void;
  onDecideLoanRequest: (
    requestId: string,
    decision: LoanRequestStatus.APPROVED | LoanRequestStatus.REJECTED,
    reviewNote: string
  ) => void;
}

export const ManagerApprovalsView: React.FC<ManagerApprovalsViewProps> = ({
  state,
  loanFilter,
  loanSearch,
  onChangeLoanFilter,
  onChangeLoanSearch,
  onToggleChecklist,
  onDecideLoanRequest,
}) => {
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const pendingCount = state.loanRequests.filter(
    (r) => r.status === LoanRequestStatus.PENDING
  ).length;

  const q = loanSearch.trim().toLowerCase();
  const filteredRequests = state.loanRequests.filter((req) => {
    if (loanFilter !== 'ALL' && req.status !== loanFilter) return false;
    if (!q) return true;
    return (
      req.applicantName.toLowerCase().includes(q) ||
      req.applicantHandle.toLowerCase().includes(q) ||
      req.referenceCode.toLowerCase().includes(q) ||
      req.purpose.toLowerCase().includes(q) ||
      req.nationalId.toLowerCase().includes(q)
    );
  });

  return (
    <section className="bg-surface border border-line rounded-3xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <p className="text-xs font-medium text-brand">
            Credit Underwriting Desk
          </p>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
            Verify &amp; Approve Loan Requests
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-subtle rounded-xl">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onChangeLoanFilter(f)}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  loanFilter === f
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {f === 'PENDING'
                  ? `Pending (${pendingCount})`
                  : f === 'APPROVED'
                  ? 'Approved'
                  : f === 'REJECTED'
                  ? 'Declined'
                  : 'All'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={loanSearch}
              onChange={(e) => onChangeLoanSearch(e.target.value)}
              placeholder="Search applicant, National ID, ref..."
              className="w-full min-h-[42px] pl-9 pr-8 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
            />
            {loanSearch && (
              <button
                type="button"
                onClick={() => onChangeLoanSearch('')}
                aria-label="Clear loan search"
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[30px] min-w-[30px] flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <ClipboardCheck className="w-8 h-8 text-success mx-auto" />
          <p className="font-display text-base font-bold text-ink">
            No loan requests match this filter
          </p>
          <p className="text-xs text-ink-secondary">
            Switch filter tabs above or submit a new loan request from a Shareholder account.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredRequests.map((req: LoanRequestItem) => {
            const isPending = req.status === LoanRequestStatus.PENDING;
            const isApproved = req.status === LoanRequestStatus.APPROVED;
            const checklist = req.checklist || {
              kycVerified: false,
              shareCapitalChecked: false,
              repaymentCapacityChecked: false,
            };
            const noteVal =
              reviewNotes[req.id] ??
              'Verified National ID KYC, monthly income capacity, and share capital standing.';

            return (
              <div
                key={req.id}
                className="bg-canvas rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-line">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary font-mono tabular-nums">
                      <span className="font-bold text-ink">
                        {req.referenceCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{req.createdAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>ID {req.nationalId}</span>
                    </div>
                    <h2 className="font-display text-base sm:text-lg font-bold text-ink">
                      {req.applicantName} ({req.applicantHandle}) — {req.purpose}
                    </h2>
                    <p className="text-xs text-ink-secondary">
                      {req.applicantProfile} · Paid-Up Share Capital{' '}
                      <strong className="font-mono text-ink">
                        {formatPHP(req.shareCapitalSnapshot)}
                      </strong>{' '}
                      · Payout via {req.disbursementChannel}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className="font-mono tabular-nums text-xl font-extrabold text-ink">
                      {formatPHP(req.principal)}
                    </p>
                    <p className="text-xs text-ink-secondary font-mono tabular-nums">
                      {req.tenor} mos · {formatPHP(req.monthlyInstallment)}/mo (
                      {req.monthlyRatePct.toFixed(2)}%)
                    </p>
                    <p
                      className={`text-xs font-semibold mt-1 inline-flex items-center gap-1 ${
                        isPending
                          ? 'text-warning'
                          : isApproved
                          ? 'text-success'
                          : 'text-danger'
                      }`}
                    >
                      {isPending ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : isApproved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isPending
                          ? 'Pending Verification'
                          : isApproved
                          ? 'Approved & Disbursed'
                          : 'Declined'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        key: 'kycVerified',
                        label: 'National ID & KYC Verified',
                      },
                      {
                        key: 'shareCapitalChecked',
                        label: 'Share Capital & Credit Standing',
                      },
                      {
                        key: 'repaymentCapacityChecked',
                        label: 'Debt-to-Income Capacity Confirmed',
                      },
                    ] as const
                  ).map((item) => {
                    const checked = checklist[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        disabled={!isPending}
                        onClick={() => onToggleChecklist(req.id, item.key)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 text-left transition-colors ${
                          isPending ? 'cursor-pointer' : 'cursor-default'
                        } ${
                          checked
                            ? 'bg-surface text-success border border-line'
                            : 'bg-surface/60 text-ink-secondary border border-line'
                        }`}
                      >
                        <ShieldCheck
                          className={`w-4 h-4 shrink-0 ${
                            checked ? 'text-success' : 'text-ink-muted'
                          }`}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {isPending ? (
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={noteVal}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                      placeholder="Enter underwriting review note..."
                      className="flex-1 min-h-[46px] px-3.5 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onDecideLoanRequest(
                            req.id,
                            LoanRequestStatus.APPROVED,
                            noteVal
                          )
                        }
                        className="min-h-[46px] px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve &amp; Disburse</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onDecideLoanRequest(
                            req.id,
                            LoanRequestStatus.REJECTED,
                            reviewNotes[req.id] ||
                              'Returned: Additional income or ID documentation required.'
                          )
                        }
                        className="min-h-[46px] px-4 py-2.5 rounded-xl bg-surface hover:bg-brand-soft border border-line text-danger text-xs font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ) : (
                  req.reviewNote && (
                    <p className="text-xs text-ink-secondary pt-1">
                      Decision by <strong>{req.reviewedBy}</strong> ({req.reviewedAt}): “
                      {req.reviewNote}”
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
