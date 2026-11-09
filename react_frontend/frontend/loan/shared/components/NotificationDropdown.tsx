import React, { useMemo } from 'react';
import {
  ArrowDownLeft,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  formatPHP,
  LedgerEntry,
  LoanRequestItem,
  LoanRequestStatus,
  NotificationItem,
  PlatformUser,
  UserRole,
} from '../creditData';

interface NotificationDropdownProps {
  user: PlatformUser;
  notifications: NotificationItem[];
  loanRequests: LoanRequestItem[];
  ledger: LedgerEntry[];
  balanceMasked: boolean;
  onSelectNotification: (item: NotificationItem) => void;
  onSelectLoanRequest: (req: LoanRequestItem) => void;
  onSelectLedgerEntry: (entry: LedgerEntry) => void;
  onMarkAllRead: () => void;
}

type UnifiedIconKind =
  | 'approval'
  | 'payment'
  | 'inflow'
  | 'pending'
  | 'declined'
  | 'ticket'
  | 'account'
  | 'loan';

interface UnifiedFeedItem {
  id: string;
  title: string;
  summary: string;
  compactTime: string;
  sortTimeMs: number;
  read: boolean;
  iconKind: UnifiedIconKind;
  onSelect: () => void;
}

const MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseTimestampMs(raw: string): number {
  if (!raw) return 0;
  // Matches formats like "Nov 2, 2026 · 01:15 PM" or "Oct 14, 2026"
  const match = raw.match(
    /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})(?:\s*·\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i
  );
  if (match) {
    const month = MONTH_INDEX[match[1]] ?? 0;
    const day = Number(match[2]);
    const year = Number(match[3]);
    let hour = match[4] ? Number(match[4]) : 0;
    const minute = match[5] ? Number(match[5]) : 0;
    const meridiem = (match[6] || '').toUpperCase();

    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;

    return new Date(year, month, day, hour, minute).getTime();
  }

  const fallback = Date.parse(raw.replace(' · ', ' '));
  return Number.isNaN(fallback) ? 0 : fallback;
}

function formatCompactTime(raw: string): string {
  if (!raw) return '';
  // Shorten "Nov 2, 2026 · 01:15 PM" -> "Nov 2 · 01:15 PM"
  return raw.replace(/,\s*\d{4}/, '');
}

function renderFeedIcon(kind: UnifiedIconKind) {
  switch (kind) {
    case 'approval':
      return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
    case 'payment':
      return <CreditCard className="w-3.5 h-3.5 text-success" />;
    case 'inflow':
      return <ArrowDownLeft className="w-3.5 h-3.5 text-ink" />;
    case 'pending':
      return <Clock className="w-3.5 h-3.5 text-warning" />;
    case 'declined':
      return <XCircle className="w-3.5 h-3.5 text-danger" />;
    case 'ticket':
      return <MessageSquare className="w-3.5 h-3.5 text-brand" />;
    case 'account':
      return <ShieldCheck className="w-3.5 h-3.5 text-success" />;
    case 'loan':
    default:
      return <Wallet className="w-3.5 h-3.5 text-ink" />;
  }
}

function mapCategoryToIcon(
  category: NotificationItem['category'],
  title: string
): UnifiedIconKind {
  const lower = title.toLowerCase();
  if (lower.includes('declined') || lower.includes('rejected')) {
    return 'declined';
  }
  if (lower.includes('pending') || lower.includes('submitted') || lower.includes('awaiting')) {
    return 'pending';
  }
  switch (category) {
    case 'APPROVAL':
      return 'approval';
    case 'PAYMENT':
      return 'payment';
    case 'TICKET':
      return 'ticket';
    case 'ACCOUNT':
      return 'account';
    case 'LOAN':
    default:
      return lower.includes('approved') ? 'approval' : 'loan';
  }
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  user,
  notifications,
  loanRequests,
  ledger,
  balanceMasked,
  onSelectNotification,
  onSelectLoanRequest,
  onSelectLedgerEntry,
  onMarkAllRead,
}) => {
  const isShareholder = user.role === UserRole.SHAREHOLDER;

  const unifiedItems = useMemo<UnifiedFeedItem[]>(() => {
    const items: UnifiedFeedItem[] = [];
    const seenRefs = new Set<string>();
    const seenApprovalMoments = new Set<string>();

    // 1. Direct notifications
    for (const n of notifications) {
      if (n.referenceCode) {
        seenRefs.add(n.referenceCode);
      }
      if (
        n.category === 'APPROVAL' ||
        n.title.toLowerCase().includes('approved')
      ) {
        seenApprovalMoments.add(`${n.userId}|${n.timestamp}`);
      }

      items.push({
        id: `ntf-${n.id}`,
        title: n.title,
        summary: n.message,
        compactTime: formatCompactTime(n.timestamp),
        sortTimeMs: parseTimestampMs(n.timestamp),
        read: n.read,
        iconKind: mapCategoryToIcon(n.category, n.title),
        onSelect: () => onSelectNotification(n),
      });
    }

    // 2. Transactions from ledger (merged as general notifications if not already represented)
    for (const entry of ledger) {
      if (entry.referenceCode && seenRefs.has(entry.referenceCode)) {
        continue;
      }
      if (entry.referenceCode) {
        seenRefs.add(entry.referenceCode);
      }
      if (entry.direction === 'INFLOW') {
        seenApprovalMoments.add(`${entry.userId}|${entry.timestamp}`);
      }

      const signedAmount = `${
        entry.direction === 'REPAYMENT' ? '-' : '+'
      }${formatPHP(entry.amount, balanceMasked)}`;

      items.push({
        id: `led-${entry.id}`,
        title: entry.title,
        summary: `${signedAmount} · ${entry.subtitle}`,
        compactTime: formatCompactTime(entry.timestamp),
        sortTimeMs: parseTimestampMs(entry.timestamp),
        read: true,
        iconKind: entry.direction === 'REPAYMENT' ? 'payment' : 'inflow',
        onSelect: () => onSelectLedgerEntry(entry),
      });
    }

    // 3. Loan application status events (merged as general notifications if not already represented)
    for (const req of loanRequests) {
      if (req.referenceCode && seenRefs.has(req.referenceCode)) {
        continue;
      }
      const eventTimestamp = req.reviewedAt || req.createdAt;
      if (
        req.status === LoanRequestStatus.APPROVED &&
        seenApprovalMoments.has(`${req.userId}|${eventTimestamp}`)
      ) {
        continue;
      }

      const statusTitle =
        req.status === LoanRequestStatus.PENDING
          ? 'Loan Request Pending'
          : req.status === LoanRequestStatus.APPROVED
          ? 'Cash Loan Approved'
          : 'Loan Request Declined';

      const iconKind: UnifiedIconKind =
        req.status === LoanRequestStatus.PENDING
          ? 'pending'
          : req.status === LoanRequestStatus.APPROVED
          ? 'approval'
          : 'declined';

      const detailLine = isShareholder
        ? `${formatPHP(req.principal, balanceMasked)} (${req.tenor}m) · ${req.purpose}`
        : `${req.applicantHandle} · ${formatPHP(req.principal, balanceMasked)} · ${req.purpose}`;

      items.push({
        id: `req-${req.id}`,
        title: statusTitle,
        summary: detailLine,
        compactTime: formatCompactTime(eventTimestamp),
        sortTimeMs: parseTimestampMs(eventTimestamp),
        read: true,
        iconKind,
        onSelect: () => onSelectLoanRequest(req),
      });
    }

    return items.sort((a, b) => b.sortTimeMs - a.sortTimeMs);
  }, [
    notifications,
    ledger,
    loanRequests,
    balanceMasked,
    isShareholder,
    onSelectNotification,
    onSelectLedgerEntry,
    onSelectLoanRequest,
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      role="menu"
      aria-label="Notifications list"
      className="fixed left-3 right-3 top-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[376px] z-50 rounded-2xl bg-surface border border-line shadow-xl overflow-hidden flex flex-col max-h-[min(440px,calc(100vh-5rem))]"
    >
      {/* Compact Header */}
      <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-2 shrink-0">
        <span className="font-display text-sm font-extrabold text-ink">
          Notifications
        </span>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="min-h-[30px] px-2 -mr-1.5 rounded-lg hover:bg-subtle text-xs font-semibold text-brand inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Single Unified Notification List */}
      {unifiedItems.length === 0 ? (
        <div className="px-4 py-8 text-center space-y-1.5">
          <Bell className="w-6 h-6 text-ink-muted mx-auto" />
          <p className="text-xs text-ink-secondary">No notifications yet.</p>
        </div>
      ) : (
        <div className="overflow-y-auto divide-y divide-line">
          {unifiedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={item.onSelect}
              className={`w-full min-h-[56px] px-3.5 py-2.5 text-left flex items-start gap-2.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-brand ${
                item.read
                  ? 'bg-surface hover:bg-canvas'
                  : 'bg-brand-soft/45 hover:bg-subtle'
              }`}
            >
              <span className="w-7 h-7 rounded-full bg-subtle flex items-center justify-center shrink-0 mt-0.5">
                {renderFeedIcon(item.iconKind)}
              </span>

              <span className="min-w-0 flex-1 block space-y-0.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-xs truncate ${
                      item.read
                        ? 'font-semibold text-ink'
                        : 'font-bold text-ink'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-ink-muted whitespace-nowrap shrink-0">
                    {!item.read && (
                      <span className="font-sans font-semibold text-brand mr-1">
                        New ·
                      </span>
                    )}
                    {item.compactTime}
                  </span>
                </span>

                <span className="block text-[11px] text-ink-secondary truncate">
                  {item.summary}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
