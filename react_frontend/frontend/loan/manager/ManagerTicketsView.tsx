import React, { useState } from 'react';
import { MessageSquare, Search, Send, Star, X } from 'lucide-react';
import {
  getRoleLabel,
  PlatformState,
  SupportTicketItem,
  TicketStatus,
} from '../shared/creditData';

interface ManagerTicketsViewProps {
  state: PlatformState;
  ticketFilter: 'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'FEEDBACK';
  ticketSearch: string;
  onChangeTicketFilter: (
    filter: 'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'FEEDBACK'
  ) => void;
  onChangeTicketSearch: (search: string) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
}

export const ManagerTicketsView: React.FC<ManagerTicketsViewProps> = ({
  state,
  ticketFilter,
  ticketSearch,
  onChangeTicketFilter,
  onChangeTicketSearch,
  onUpdateTicketStatus,
  onReplyTicket,
}) => {
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const tQuery = ticketSearch.trim().toLowerCase();
  const filteredTickets = state.tickets.filter((t) => {
    if (ticketFilter === 'FEEDBACK' && t.kind !== 'FEEDBACK') return false;
    if (ticketFilter === 'OPEN' && t.status !== TicketStatus.OPEN) return false;
    if (ticketFilter === 'IN_REVIEW' && t.status !== TicketStatus.IN_REVIEW)
      return false;
    if (ticketFilter === 'RESOLVED' && t.status !== TicketStatus.RESOLVED)
      return false;
    if (!tQuery) return true;
    return (
      t.subject.toLowerCase().includes(tQuery) ||
      t.userName.toLowerCase().includes(tQuery) ||
      t.referenceCode.toLowerCase().includes(tQuery) ||
      t.description.toLowerCase().includes(tQuery)
    );
  });

  return (
    <section className="bg-surface border border-line rounded-3xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <p className="text-xs font-medium text-brand">
            Member Resolution Desk
          </p>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
            Manage Support Tickets &amp; Feedbacks
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-subtle rounded-xl">
            {(['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'FEEDBACK'] as const).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onChangeTicketFilter(f)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    ticketFilter === f
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  {f === 'ALL'
                    ? 'All'
                    : f === 'OPEN'
                    ? 'Open'
                    : f === 'IN_REVIEW'
                    ? 'In Review'
                    : f === 'RESOLVED'
                    ? 'Resolved'
                    : 'Feedback'}
                </button>
              )
            )}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={ticketSearch}
              onChange={(e) => onChangeTicketSearch(e.target.value)}
              placeholder="Search ticket or member..."
              className="w-full min-h-[42px] pl-9 pr-8 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
            />
            {ticketSearch && (
              <button
                type="button"
                onClick={() => onChangeTicketSearch('')}
                aria-label="Clear ticket search"
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[30px] min-w-[30px] flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-ink-muted mx-auto" />
          <p className="text-xs text-ink-secondary">
            No tickets or feedbacks match this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((tkt: SupportTicketItem) => {
            const draft = replyDrafts[tkt.id] || '';
            return (
              <div
                key={tkt.id}
                className="bg-canvas rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary font-mono tabular-nums">
                    <span className="font-bold text-ink">
                      {tkt.referenceCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {tkt.userName} ({tkt.userHandle})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {tkt.kind === 'FEEDBACK' ? (
                        <span className="inline-flex items-center gap-1 text-ink font-semibold">
                          <Star className="w-3.5 h-3.5 fill-current text-brand" />
                          {tkt.rating}/5 Feedback
                        </span>
                      ) : (
                        `${tkt.category} · ${tkt.priority}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(
                      [
                        { st: TicketStatus.OPEN, label: 'Open' },
                        { st: TicketStatus.IN_REVIEW, label: 'In Review' },
                        { st: TicketStatus.RESOLVED, label: 'Resolved' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.st}
                        type="button"
                        onClick={() => onUpdateTicketStatus(tkt.id, opt.st)}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          tkt.status === opt.st
                            ? 'bg-inverse text-ink-inverse'
                            : 'bg-surface text-ink-secondary border border-line'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-base font-bold text-ink">
                    {tkt.subject}
                  </h2>
                  <p className="text-xs text-ink-secondary leading-relaxed mt-1">
                    {tkt.description}
                  </p>
                </div>

                {tkt.replies.length > 0 && (
                  <div className="pt-3 border-t border-line space-y-2">
                    {tkt.replies.map((rep) => (
                      <div key={rep.id} className="text-xs">
                        <span className="font-semibold text-ink">
                          {rep.authorName}
                        </span>{' '}
                        <span className="text-brand">
                          ({getRoleLabel(rep.authorRole)})
                        </span>{' '}
                        <span className="text-ink-muted font-mono">
                          · {rep.timestamp}
                        </span>
                        <p className="text-ink mt-0.5">{rep.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({
                        ...prev,
                        [tkt.id]: e.target.value,
                      }))
                    }
                    placeholder="Write official Manager response & mark In Review / Resolved..."
                    className="flex-1 min-h-[42px] px-3.5 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!draft.trim()) return;
                      onReplyTicket(tkt.id, draft.trim());
                      setReplyDrafts((prev) => ({ ...prev, [tkt.id]: '' }));
                    }}
                    className="min-h-[42px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
