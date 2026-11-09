import React, { useState } from 'react';
import { FileSpreadsheet, Send, Star } from 'lucide-react';
import {
  formatPHP,
  getRoleLabel,
  LoanRequestStatus,
  PlatformState,
  TicketStatus,
} from '../shared/creditData';

interface AdminReportsViewProps {
  state: PlatformState;
  reportsSubView: 'analytics' | 'feedbacks';
  focusedTicketRef?: string;
  onChangeReportsSubView: (view: 'analytics' | 'feedbacks') => void;
  onClearFocusedTicket: () => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({
  state,
  reportsSubView,
  focusedTicketRef,
  onChangeReportsSubView,
  onClearFocusedTicket,
  onUpdateTicketStatus,
  onReplyTicket,
}) => {
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>(
    {}
  );

  const handleExportCsvReport = () => {
    const headers = [
      'ReferenceCode',
      'Applicant',
      'Handle',
      'National_ID',
      'Purpose',
      'Principal_PHP',
      'Tenor_Months',
      'MonthlyRate_Pct',
      'TotalRepayment_PHP',
      'Status',
      'CreatedAt',
    ];
    const rows = state.loanRequests.map((r) => [
      r.referenceCode,
      `"${r.applicantName}"`,
      r.applicantHandle,
      r.nationalId,
      `"${r.purpose}"`,
      r.principal.toFixed(2),
      String(r.tenor),
      r.monthlyRatePct.toFixed(2),
      r.totalRepayment.toFixed(2),
      r.status,
      `"${r.createdAt}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tikcredit_portfolio_report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalDisbursed = state.plans.reduce((s, p) => s + p.principal, 0);
  const totalCollected = state.ledger
    .filter((l) => l.direction === 'REPAYMENT')
    .reduce((s, l) => s + l.amount, 0);
  const totalScheduledInterest = state.plans.reduce(
    (s, p) =>
      s + p.installments.reduce((is, inst) => is + inst.interestPart, 0),
    0
  );
  const feedbackItems = state.tickets.filter((t) => t.kind === 'FEEDBACK');
  const avgRating =
    feedbackItems.length > 0
      ? (
          feedbackItems.reduce((s, f) => s + (f.rating || 5), 0) /
          feedbackItems.length
        ).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-surface border border-line rounded-xl">
          <button
            type="button"
            onClick={() => onChangeReportsSubView('analytics')}
            className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
              reportsSubView === 'analytics'
                ? 'bg-inverse text-ink-inverse'
                : 'text-ink-secondary'
            }`}
          >
            Portfolio Reports
          </button>
          <button
            type="button"
            onClick={() => onChangeReportsSubView('feedbacks')}
            className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
              reportsSubView === 'feedbacks'
                ? 'bg-inverse text-ink-inverse'
                : 'text-ink-secondary'
            }`}
          >
            Feedbacks &amp; Tickets ({state.tickets.length})
          </button>
        </div>

        {reportsSubView === 'analytics' && (
          <button
            type="button"
            onClick={handleExportCsvReport}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        )}
      </div>

      {reportsSubView === 'analytics' ? (
        <div className="space-y-6">
          <section className="bg-surface border border-line rounded-3xl p-6 sm:p-8">
            <h1 className="font-display text-xl font-extrabold text-ink pb-5 border-b border-line">
              Executive Financial &amp; Revolving Credit Report
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
              <div>
                <p className="text-xs text-ink-secondary">
                  Cumulative Disbursed Principal
                </p>
                <p className="font-mono tabular-nums text-2xl font-extrabold text-ink mt-1">
                  {formatPHP(totalDisbursed)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-secondary">
                  Collected Repayments
                </p>
                <p className="font-mono tabular-nums text-2xl font-extrabold text-success mt-1">
                  {formatPHP(totalCollected)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-secondary">
                  Contracted Interest Yield
                </p>
                <p className="font-mono tabular-nums text-2xl font-extrabold text-ink mt-1">
                  {formatPHP(totalScheduledInterest)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-secondary">
                  Member Satisfaction Avg
                </p>
                <p className="font-mono tabular-nums text-2xl font-extrabold text-brand mt-1">
                  {avgRating} / 5.0 ★
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-4">
            <h2 className="font-display text-base font-bold text-ink">
              Loan Application Pipeline Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-line text-ink-secondary">
                    <th className="py-3 pr-4 font-semibold">Reference</th>
                    <th className="py-3 pr-4 font-semibold">Shareholder</th>
                    <th className="py-3 pr-4 font-semibold">Purpose</th>
                    <th className="py-3 pr-4 font-semibold text-right">
                      Principal
                    </th>
                    <th className="py-3 pr-4 font-semibold text-right">
                      Total Due
                    </th>
                    <th className="py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {state.loanRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-canvas">
                      <td className="py-3 pr-4 font-mono tabular-nums font-semibold text-ink">
                        {r.referenceCode}
                      </td>
                      <td className="py-3 pr-4 text-ink">
                        {r.applicantName} ({r.applicantHandle})
                      </td>
                      <td className="py-3 pr-4 text-ink-secondary">
                        {r.purpose}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums font-semibold">
                        {formatPHP(r.principal)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums">
                        {formatPHP(r.totalRepayment)}
                      </td>
                      <td className="py-3 text-right font-semibold">
                        <span
                          className={
                            r.status === LoanRequestStatus.APPROVED
                              ? 'text-success'
                              : r.status === LoanRequestStatus.PENDING
                              ? 'text-warning'
                              : 'text-danger'
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <section className="bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
            <h2 className="font-display text-lg font-bold text-ink">
              Member Feedbacks &amp; Support Tickets
            </h2>
            {focusedTicketRef && (
              <button
                type="button"
                onClick={onClearFocusedTicket}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-canvas hover:bg-subtle text-xs font-semibold text-ink cursor-pointer"
              >
                Focused: {focusedTicketRef} · Clear
              </button>
            )}
          </div>

          <div className="space-y-4">
            {(focusedTicketRef
              ? [...state.tickets].sort((a, b) =>
                  a.referenceCode === focusedTicketRef
                    ? -1
                    : b.referenceCode === focusedTicketRef
                    ? 1
                    : 0
                )
              : state.tickets
            ).map((tkt) => {
              const draft = ticketReplies[tkt.id] || '';
              const isFocused = focusedTicketRef === tkt.referenceCode;
              return (
                <div
                  key={tkt.id}
                  className={`rounded-2xl p-5 space-y-3 transition-colors ${
                    isFocused ? 'bg-surface border border-ink' : 'bg-canvas'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-ink">
                      {tkt.referenceCode} · {tkt.userName} ({tkt.userHandle}) ·{' '}
                      {tkt.kind === 'FEEDBACK' ? (
                        <span className="inline-flex items-center gap-1 text-brand">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {tkt.rating}/5 Rating
                        </span>
                      ) : (
                        tkt.category
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          TicketStatus.OPEN,
                          TicketStatus.IN_REVIEW,
                          TicketStatus.RESOLVED,
                        ] as const
                      ).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => onUpdateTicketStatus(tkt.id, st)}
                          className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            tkt.status === st
                              ? 'bg-inverse text-ink-inverse'
                              : 'bg-surface text-ink-secondary border border-line'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-ink">{tkt.subject}</p>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      {tkt.description}
                    </p>
                  </div>

                  {tkt.replies.length > 0 && (
                    <div className="pt-2 border-t border-line space-y-1.5 text-xs">
                      {tkt.replies.map((r) => (
                        <p key={r.id}>
                          <strong>{r.authorName}</strong> (
                          {getRoleLabel(r.authorRole)}): {r.message}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) =>
                        setTicketReplies((prev) => ({
                          ...prev,
                          [tkt.id]: e.target.value,
                        }))
                      }
                      placeholder="Post System Admin response..."
                      className="flex-1 min-h-[40px] px-3.5 bg-surface border border-line rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!draft.trim()) return;
                        onReplyTicket(tkt.id, draft.trim());
                        setTicketReplies((prev) => ({
                          ...prev,
                          [tkt.id]: '',
                        }));
                      }}
                      className="min-h-[40px] px-4 rounded-xl bg-inverse text-ink-inverse text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
