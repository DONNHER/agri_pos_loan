import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MessageSquarePlus,
  Send,
  Star,
} from 'lucide-react';
import {
  LoanRequestItem,
  SupportTicketItem,
  TicketStatus,
  getRoleLabel,
} from '../shared/creditData';

interface MemberSupportViewProps {
  tickets: SupportTicketItem[];
  loanRequests: LoanRequestItem[];
  focusedTicketRef?: string;
  onClearFocus?: () => void;
  onSubmitTicketOrFeedback: (payload: {
    kind: 'TICKET' | 'FEEDBACK';
    category: SupportTicketItem['category'];
    priority: SupportTicketItem['priority'];
    rating?: number;
    subject: string;
    description: string;
    relatedLoanRef?: string;
  }) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
}

export const MemberSupportView: React.FC<MemberSupportViewProps> = ({
  tickets,
  loanRequests,
  focusedTicketRef,
  onClearFocus,
  onSubmitTicketOrFeedback,
  onReplyTicket,
}) => {
  const [kind, setKind] = useState<'TICKET' | 'FEEDBACK'>('TICKET');
  const [category, setCategory] = useState<SupportTicketItem['category']>(
    'Loan Approval & Disbursement'
  );
  const [priority, setPriority] =
    useState<SupportTicketItem['priority']>('Normal');
  const [rating, setRating] = useState<number>(5);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [relatedLoanRef, setRelatedLoanRef] = useState<string>('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const orderedTickets = focusedTicketRef
    ? [...tickets].sort((a, b) =>
        a.referenceCode === focusedTicketRef
          ? -1
          : b.referenceCode === focusedTicketRef
          ? 1
          : 0
      )
    : tickets;

  const categories: SupportTicketItem['category'][] = [
    'Loan Approval & Disbursement',
    'Repayment & Billing',
    'Credit Limit & Share Capital',
    'Account & Security',
    'Service Experience',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    onSubmitTicketOrFeedback({
      kind,
      category: kind === 'FEEDBACK' ? 'Service Experience' : category,
      priority: kind === 'FEEDBACK' ? 'Normal' : priority,
      rating: kind === 'FEEDBACK' ? rating : undefined,
      subject: subject.trim(),
      description: description.trim(),
      relatedLoanRef: relatedLoanRef || undefined,
    });

    setSubject('');
    setDescription('');
    setRelatedLoanRef('');
  };

  const handleSendReply = (ticketId: string) => {
    const msg = (replyDrafts[ticketId] || '').trim();
    if (!msg) return;
    onReplyTicket(ticketId, msg);
    setReplyDrafts((prev) => ({ ...prev, [ticketId]: '' }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 5 Cols: Submit Support Ticket or Service Feedback */}
      <section className="lg:col-span-5 bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-5">
        <div className="pb-4 border-b border-line">
          <p className="text-xs font-medium text-brand">
            Member Care &amp; Resolution Desk
          </p>
          <h1 className="font-display text-xl font-extrabold text-ink mt-0.5">
            Submit Ticket or Feedback
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Routed directly to your Loan Manager and System Administrator.
          </p>
        </div>

        {/* Mode Segmented Switcher */}
        <div
          className="grid grid-cols-2 gap-1 p-1 bg-subtle rounded-xl"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'TICKET'}
            onClick={() => setKind('TICKET')}
            className={`min-h-[42px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              kind === 'TICKET'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            Report Support Ticket
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'FEEDBACK'}
            onClick={() => setKind('FEEDBACK')}
            className={`min-h-[42px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              kind === 'FEEDBACK'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            Submit Feedback
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {kind === 'TICKET' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as SupportTicketItem['category'])
                  }
                  className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-xs font-medium text-ink focus:outline-none focus:border-ink"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-medium text-ink-secondary mb-1.5">
                  Urgency Level
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'High', 'Urgent'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`min-h-[40px] rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        priority === p
                          ? 'bg-inverse text-ink-inverse'
                          : 'bg-canvas text-ink-secondary hover:text-ink'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs font-medium text-ink-secondary mb-2">
                Overall TikCredit Experience Rating
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} out of 5`}
                    className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center gap-1 font-mono text-xs font-bold transition-colors cursor-pointer ${
                      star <= rating
                        ? 'bg-inverse text-accent'
                        : 'bg-canvas text-ink-muted'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>{star}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loanRequests.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                Related Loan Reference (Optional)
              </label>
              <select
                value={relatedLoanRef}
                onChange={(e) => setRelatedLoanRef(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-xs font-mono tabular-nums text-ink focus:outline-none focus:border-ink"
              >
                <option value="">None / General Inquiry</option>
                {loanRequests.map((lr) => (
                  <option key={lr.id} value={lr.referenceCode}>
                    {lr.referenceCode} — {lr.purpose}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">
              Subject Summary
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                kind === 'TICKET'
                  ? 'e.g. Follow up on pending cash loan disbursement'
                  : 'e.g. Fast GCash loan payout and clear installment plan'
              }
              className="w-full min-h-[46px] px-3.5 py-2 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">
              Details
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details so our Loan Manager or Admin team can assist quickly..."
              className="w-full p-3.5 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>
              {kind === 'TICKET'
                ? 'Submit Support Ticket'
                : 'Submit Member Feedback'}
            </span>
          </button>
        </form>
      </section>

      {/* Right 7 Cols: Ticket & Feedback Threads */}
      <section className="lg:col-span-7 bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              My Tickets &amp; Feedbacks ({tickets.length})
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Live status updates and official responses from Managers &amp; Admins
            </p>
          </div>
          {focusedTicketRef && onClearFocus && (
            <button
              type="button"
              onClick={onClearFocus}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-canvas hover:bg-subtle text-xs font-semibold text-ink cursor-pointer"
            >
              Focused: {focusedTicketRef} · Clear
            </button>
          )}
        </div>

        {orderedTickets.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-secondary">
            No support tickets or feedbacks submitted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {orderedTickets.map((tkt) => {
              const isResolved = tkt.status === TicketStatus.RESOLVED;
              const isInReview = tkt.status === TicketStatus.IN_REVIEW;
              const isFocused = focusedTicketRef === tkt.referenceCode;
              return (
                <div
                  key={tkt.id}
                  className={`rounded-2xl p-5 space-y-3.5 transition-colors ${
                    isFocused
                      ? 'bg-surface border border-ink'
                      : 'bg-canvas'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-ink-secondary font-mono tabular-nums">
                      <span className="font-semibold text-ink">
                        {tkt.referenceCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {tkt.kind === 'FEEDBACK'
                          ? `Feedback (${tkt.rating}/5 ★)`
                          : `${tkt.category} · ${tkt.priority}`}
                      </span>
                      {tkt.relatedLoanRef && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Ref {tkt.relatedLoanRef}</span>
                        </>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isResolved
                          ? 'text-success'
                          : isInReview
                          ? 'text-warning'
                          : 'text-brand'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isResolved
                          ? 'Resolved'
                          : isInReview
                          ? 'In Manager Review'
                          : 'Open'}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-sm sm:text-base font-bold text-ink">
                      {tkt.subject}
                    </h3>
                    <p className="text-xs text-ink-secondary leading-relaxed mt-1">
                      {tkt.description}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-1.5 font-mono tabular-nums">
                      Submitted {tkt.createdAt}
                    </p>
                  </div>

                  {/* Conversation Replies */}
                  {tkt.replies.length > 0 && (
                    <div className="pt-3 border-t border-line space-y-2.5">
                      {tkt.replies.map((rep) => (
                        <div key={rep.id} className="text-xs space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">
                              {rep.authorName}
                            </span>
                            <span className="text-ink-secondary">·</span>
                            <span className="text-brand font-medium">
                              {getRoleLabel(rep.authorRole)}
                            </span>
                            <span className="text-ink-muted font-mono tabular-nums ml-auto">
                              {rep.timestamp}
                            </span>
                          </div>
                          <p className="text-ink leading-relaxed">
                            {rep.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Reply Input */}
                  {!isResolved && (
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyDrafts[tkt.id] || ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [tkt.id]: e.target.value,
                          }))
                        }
                        placeholder="Add a follow-up note..."
                        className="flex-1 min-h-[42px] px-3.5 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(tkt.id)}
                        className="min-h-[42px] px-3.5 rounded-xl bg-inverse text-ink-inverse text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
