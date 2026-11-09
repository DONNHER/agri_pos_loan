import React, { useState } from 'react';
import { CheckCircle2, Search, X, XCircle } from 'lucide-react';
import {
  formatPHP,
  LoanRequestStatus,
  PlatformState,
} from '../shared/creditData';

interface AdminLoansViewProps {
  state: PlatformState;
  loanStatusFilter: 'ALL' | LoanRequestStatus;
  loanSearch: string;
  onChangeLoanStatusFilter: (filter: 'ALL' | LoanRequestStatus) => void;
  onChangeLoanSearch: (search: string) => void;
  onDecideLoanRequest: (
    requestId: string,
    decision: LoanRequestStatus.APPROVED | LoanRequestStatus.REJECTED,
    reviewNote: string
  ) => void;
  onReopenLoanRequest: (requestId: string) => void;
}

export const AdminLoansView: React.FC<AdminLoansViewProps> = ({
  state,
  loanStatusFilter,
  loanSearch,
  onChangeLoanStatusFilter,
  onChangeLoanSearch,
  onDecideLoanRequest,
  onReopenLoanRequest,
}) => {
  const [adminLoanNotes, setAdminLoanNotes] = useState<Record<string, string>>(
    {}
  );

  const lsq = loanSearch.trim().toLowerCase();
  const filtered = state.loanRequests.filter((r) => {
    if (loanStatusFilter !== 'ALL' && r.status !== loanStatusFilter) {
      return false;
    }
    if (!lsq) return true;
    return (
      r.referenceCode.toLowerCase().includes(lsq) ||
      r.applicantName.toLowerCase().includes(lsq) ||
      r.applicantHandle.toLowerCase().includes(lsq) ||
      r.purpose.toLowerCase().includes(lsq)
    );
  });

  return (
    <section className="bg-surface border border-line rounded-3xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <p className="text-xs font-medium text-brand">
            Administrative Credit Override
          </p>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
            All Platform Loan Requests ({state.loanRequests.length})
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-subtle rounded-xl self-start">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: LoanRequestStatus.PENDING, label: 'Pending' },
                { id: LoanRequestStatus.APPROVED, label: 'Approved' },
                { id: LoanRequestStatus.REJECTED, label: 'Declined' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onChangeLoanStatusFilter(f.id)}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  loanStatusFilter === f.id
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-secondary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={loanSearch}
              onChange={(e) => onChangeLoanSearch(e.target.value)}
              placeholder="Search reference, borrower..."
              className="w-full min-h-[40px] pl-9 pr-8 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
            />
            {loanSearch && (
              <button
                type="button"
                onClick={() => onChangeLoanSearch('')}
                aria-label="Clear loan filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[30px] min-w-[30px] flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((req) => {
          const isPending = req.status === LoanRequestStatus.PENDING;
          const isApproved = req.status === LoanRequestStatus.APPROVED;
          const isRejected = req.status === LoanRequestStatus.REJECTED;
          const note =
            adminLoanNotes[req.id] ??
            'Admin compliance verification passed. Authorized for payout.';

          return (
            <div
              key={req.id}
              className="bg-canvas rounded-2xl p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-secondary font-mono tabular-nums">
                    {req.referenceCode} · {req.applicantName} (
                    {req.applicantHandle}) · {req.createdAt}
                  </p>
                  <h2 className="font-display text-base font-bold text-ink mt-0.5">
                    {req.purpose} — {formatPHP(req.principal)} ({req.tenor}{' '}
                    mos)
                  </h2>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    {req.applicantProfile} · Payout: {req.disbursementChannel}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onDecideLoanRequest(
                            req.id,
                            LoanRequestStatus.APPROVED,
                            note
                          )
                        }
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Admin Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onDecideLoanRequest(
                            req.id,
                            LoanRequestStatus.REJECTED,
                            adminLoanNotes[req.id] ||
                              'Declined by System Administrator during audit.'
                          )
                        }
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-surface border border-line text-danger text-xs font-semibold cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold inline-flex items-center gap-1 ${
                          isApproved ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>{isApproved ? 'Approved' : 'Declined'}</span>
                      </span>
                      {isRejected && (
                        <button
                          type="button"
                          onClick={() => onReopenLoanRequest(req.id)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-surface border border-line text-xs font-semibold text-ink cursor-pointer"
                        >
                          Reopen to Pending
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isPending && (
                <input
                  type="text"
                  value={note}
                  onChange={(e) =>
                    setAdminLoanNotes((prev) => ({
                      ...prev,
                      [req.id]: e.target.value,
                    }))
                  }
                  placeholder="Admin audit note..."
                  className="w-full min-h-[40px] px-3.5 bg-surface border border-line rounded-xl text-xs text-ink"
                />
              )}
              {!isPending && req.reviewNote && (
                <p className="text-xs text-ink-secondary">
                  Reviewed by {req.reviewedBy}: “{req.reviewNote}”
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
