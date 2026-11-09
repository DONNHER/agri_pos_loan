import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Edit3,
  KeyRound,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react';
import {
  computeUserCreditSummary,
  formatPHP,
  getRoleLabel,
  PlatformState,
  PlatformUser,
  SupportTicketItem,
  TicketStatus,
  UserRole,
} from '../creditData';
import { MemberSupportView } from '../../shareholder/MemberSupportView';
import { SafeImage } from './SafeImage';

export interface ProfileFocusTarget {
  section: 'account' | 'tickets';
  ticketRef?: string;
  nonce: number;
}

interface ProfileViewProps {
  state: PlatformState;
  user: PlatformUser;
  balanceMasked: boolean;
  initialFocus?: ProfileFocusTarget | null;
  onCompleteBoostTask: (taskId: string) => void;
  onSetDefaultChannel: (channelId: string) => void;
  onRemoveChannel: (channelId: string) => void;
  onOpenAddChannel: () => void;
  onOpenChangePin: () => void;
  onOpenEditProfile: () => void;
  onRelaunchOnboarding?: () => void;
  onChangeStatementDay: (day: 15 | 30) => void;
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
  onSectionChange?: (section: 'account' | 'tickets') => void;
  onResetDemo: () => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  state,
  user,
  balanceMasked,
  initialFocus,
  onCompleteBoostTask,
  onSetDefaultChannel,
  onRemoveChannel,
  onOpenAddChannel,
  onOpenChangePin,
  onOpenEditProfile,
  onRelaunchOnboarding,
  onChangeStatementDay,
  onSubmitTicketOrFeedback,
  onReplyTicket,
  onSectionChange,
  onResetDemo,
  onLogout,
}) => {
  const isShareholder = user.role === UserRole.SHAREHOLDER;
  const [profileSection, setProfileSection] = useState<'account' | 'tickets'>(
    initialFocus?.section || 'account'
  );
  const [focusedTicketRef, setFocusedTicketRef] = useState<string | undefined>(
    initialFocus?.ticketRef
  );

  useEffect(() => {
    if (!initialFocus) return;
    setProfileSection(initialFocus.section);
    setFocusedTicketRef(initialFocus.ticketRef);
  }, [initialFocus?.nonce]);

  useEffect(() => {
    onSectionChange?.(profileSection);
  }, [profileSection, onSectionChange]);

  const summary = computeUserCreditSummary(state, user.id);
  const openTicketsCount = summary.userTickets.filter(
    (t) => t.status !== TicketStatus.RESOLVED
  ).length;

  const initials = user.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Shareholder Profile Sub-Navigation: Account & Wallet vs Support Tickets & Feedback */}
      {isShareholder && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            className="flex items-center gap-1 p-1 bg-surface border border-line rounded-xl"
            role="tablist"
            aria-label="Shareholder profile sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={profileSection === 'account'}
              onClick={() => setProfileSection('account')}
              className={`min-h-[42px] px-4 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                profileSection === 'account'
                  ? 'bg-inverse text-ink-inverse'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile &amp; Accounts</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={profileSection === 'tickets'}
              onClick={() => setProfileSection('tickets')}
              className={`min-h-[42px] px-4 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                profileSection === 'tickets'
                  ? 'bg-inverse text-ink-inverse'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>
                Tickets &amp; Feedback ({summary.userTickets.length})
              </span>
            </button>
          </div>
        </div>
      )}

      {isShareholder && profileSection === 'tickets' ? (
        <MemberSupportView
          tickets={summary.userTickets}
          loanRequests={summary.userLoanRequests}
          focusedTicketRef={focusedTicketRef}
          onClearFocus={() => setFocusedTicketRef(undefined)}
          onSubmitTicketOrFeedback={onSubmitTicketOrFeedback}
          onReplyTicket={onReplyTicket}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: Identity, Role Metadata & Security Controls */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <SafeImage
                    src={user.avatarPath}
                    alt={user.fullName}
                    fallbackText={initials}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-brand">
                      {getRoleLabel(user.role)}
                    </p>
                    <h1 className="font-display text-xl font-extrabold text-ink truncate mt-0.5">
                      {user.fullName}
                    </h1>
                    <p className="text-xs text-ink-secondary truncate mt-0.5">
                      {user.handle} · {user.email}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-success mt-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {user.kycVerified
                          ? 'Verified Account'
                          : 'Onboarding Pending'}{' '}
                        · {user.accountId}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenEditProfile}
                  aria-label="Edit profile details"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-canvas hover:bg-subtle text-ink transition-colors cursor-pointer shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {isShareholder ? (
                <div className="space-y-4 pt-5 border-t border-line">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] text-ink-secondary">Credit Limit</p>
                      <p className="font-mono tabular-nums text-sm font-bold text-ink mt-0.5">
                        {formatPHP(summary.totalLimit, balanceMasked)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-ink-secondary">
                        Share Capital
                      </p>
                      <p className="font-mono tabular-nums text-sm font-bold text-success mt-0.5">
                        {formatPHP(user.shareCapital, balanceMasked)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-ink-secondary">Available</p>
                      <p className="font-mono tabular-nums text-sm font-bold text-ink mt-0.5">
                        {formatPHP(summary.availableCredit, balanceMasked)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line text-xs text-ink-secondary space-y-1">
                    <p className="inline-flex items-center gap-1.5 text-ink font-medium">
                      <MapPin className="w-3.5 h-3.5 text-brand" />
                      <span>{user.cityAddress}</span>
                    </p>
                    <p>
                      {user.incomeSource} · {formatPHP(user.monthlyIncome)}/mo ·
                      ID {user.nationalId}
                    </p>
                  </div>

                  {/* Direct Entry Row to Support Tickets & Feedback */}
                  <div className="pt-3 border-t border-line">
                    <button
                      type="button"
                      onClick={() => setProfileSection('tickets')}
                      className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-canvas hover:bg-subtle flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4 text-brand" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink">
                            Support Tickets &amp; Feedback
                          </p>
                          <p className="text-[11px] text-ink-secondary truncate">
                            {openTicketsCount > 0
                              ? `${openTicketsCount} active ${
                                  openTicketsCount === 1 ? 'ticket' : 'tickets'
                                } · Report issue or rate service`
                              : 'Submit a support ticket or share member feedback'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-secondary shrink-0" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-5 border-t border-line text-xs space-y-1.5">
                  <p className="text-ink-secondary">
                    Department / Operational Hub
                  </p>
                  <p className="font-semibold text-ink">
                    {user.departmentOrBranch || user.cityAddress}
                  </p>
                  <p className="text-ink-secondary font-mono tabular-nums">
                    Mobile: {user.phone}
                  </p>
                </div>
              )}
            </section>

            {/* Security & Session Controls */}
            <section className="bg-surface border border-line rounded-3xl p-6 space-y-5">
              <h2 className="font-display text-base font-bold text-ink pb-3 border-b border-line">
                Security &amp; Session Controls
              </h2>

              {isShareholder && (
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-line">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-subtle flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-ink" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink">
                        Monthly Statement Day
                      </p>
                      <p className="text-[11px] text-ink-secondary">
                        Applies to newly approved loans
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-subtle rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => onChangeStatementDay(15)}
                      className={`min-h-[36px] px-3 py-1 text-xs font-mono tabular-nums font-semibold rounded-md transition-colors cursor-pointer ${
                        user.statementDay === 15
                          ? 'bg-surface text-ink shadow-xs'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      15th
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeStatementDay(30)}
                      className={`min-h-[36px] px-3 py-1 text-xs font-mono tabular-nums font-semibold rounded-md transition-colors cursor-pointer ${
                        user.statementDay === 30
                          ? 'bg-surface text-ink shadow-xs'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      30th
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-subtle flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4 text-ink" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">
                      6-Digit Security PIN
                    </p>
                    <p className="text-[11px] text-ink-secondary">
                      Authorizes sensitive credit &amp; approval actions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenChangePin}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-canvas hover:bg-subtle text-xs font-semibold text-ink whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Update PIN
                </button>
              </div>

              {isShareholder && onRelaunchOnboarding && (
                <div className="pt-4 border-t border-line flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">
                      Member Onboarding &amp; KYC Setup
                    </p>
                    <p className="text-[11px] text-ink-secondary">
                      Update income profile, National ID, or share capital wizard
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRelaunchOnboarding}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-canvas hover:bg-subtle text-xs font-semibold text-ink inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    <span>Run Wizard</span>
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-line flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={onResetDemo}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-canvas hover:bg-subtle text-xs font-semibold text-ink-secondary hover:text-ink flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Seed Data</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-brand-soft hover:bg-brand-tint text-xs font-semibold text-danger flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </section>
          </div>

          {/* Right 7 Cols: Role-Specific Profile Details */}
          <div className="lg:col-span-7 space-y-6">
            {isShareholder ? (
              <>
                <section className="bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-5">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-brand">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Revolving Credit Limit Boost</span>
                      </div>
                      <h2 className="font-display text-lg font-bold text-ink mt-0.5">
                        Unlock Higher Personal Credit Ceiling
                      </h2>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-ink-secondary whitespace-nowrap">
                      Limit: {formatPHP(user.totalLimit)}
                    </span>
                  </div>

                  <div className="divide-y divide-line">
                    {user.boostTasks.map((task) => (
                      <div
                        key={task.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink">
                            {task.title}
                          </p>
                          <p className="text-xs text-ink-secondary mt-0.5">
                            {task.subtitle}
                            {task.boostAmount > 0
                              ? ` · +${formatPHP(task.boostAmount)}`
                              : ''}
                          </p>
                        </div>

                        {task.completed ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success whitespace-nowrap shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{task.actionLabel}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onCompleteBoostTask(task.id)}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-inverse hover:bg-inverse-hover text-ink-inverse text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
                          >
                            {task.actionLabel}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-surface border border-line rounded-3xl p-6 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-line">
                    <div>
                      <h2 className="font-display text-lg font-bold text-ink">
                        Linked Disbursement &amp; Repayment Accounts
                      </h2>
                      <p className="text-xs text-ink-secondary mt-0.5">
                        Used for approved Cash Loan payouts and 1-tap bill
                        payments
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenAddChannel}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Link Account</span>
                    </button>
                  </div>

                  {user.channels.length === 0 ? (
                    <div className="py-6 text-center text-xs text-ink-secondary">
                      No payout or repayment account linked yet. Click Link Account above to add GCash, Maya, or a bank account.
                    </div>
                  ) : (
                    <div className="divide-y divide-line">
                      {user.channels.map((ch) => (
                        <div
                          key={ch.id}
                          className="py-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-subtle flex items-center justify-center shrink-0">
                              <Wallet className="w-4 h-4 text-ink" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink truncate">
                                {ch.provider}{' '}
                                <span className="font-mono tabular-nums font-normal text-ink-secondary">
                                  {ch.accountMask}
                                </span>
                              </p>
                              <p className="text-xs text-ink-secondary truncate mt-0.5">
                                {ch.accountHolder}
                                {ch.isDefault
                                  ? ' · Primary Payout'
                                  : ' · Instant InstaPay'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {ch.isDefault ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success whitespace-nowrap">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Default</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onSetDefaultChannel(ch.id)}
                                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-canvas hover:bg-subtle text-xs font-semibold text-ink whitespace-nowrap cursor-pointer"
                                >
                                  Set Default
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRemoveChannel(ch.id)}
                                  aria-label={`Remove ${ch.provider} account`}
                                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-ink-muted hover:text-danger hover:bg-brand-soft cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : (
              /* Staff (Manager / Admin) Operational Profile Summary */
              <section className="bg-surface border border-line rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="pb-4 border-b border-line">
                  <p className="text-xs font-medium text-brand">
                    Role Permissions &amp; Scope
                  </p>
                  <h2 className="font-display text-xl font-bold text-ink mt-0.5">
                    {user.role === UserRole.MANAGER
                      ? 'Loan Operations Manager Authority'
                      : 'System Administrator Governance Scope'}
                  </h2>
                </div>

                <div className="divide-y divide-line text-xs">
                  {user.role === UserRole.MANAGER ? (
                    <>
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <span className="font-semibold text-ink">
                          Loan Request Verification &amp; Disbursement
                        </span>
                        <span className="text-success font-semibold">
                          Enabled
                        </span>
                      </div>
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <span className="font-semibold text-ink">
                          National ID KYC &amp; Credit Standing Checklist
                        </span>
                        <span className="text-success font-semibold">
                          Enabled
                        </span>
                      </div>
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <span className="font-semibold text-ink">
                          Member Ticket &amp; Feedback Resolution
                        </span>
                        <span className="text-success font-semibold">
                          Enabled
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <span className="font-semibold text-ink">
                          User Provisioning, Credit Ceiling &amp; Live
                          Impersonation
                        </span>
                        <span className="text-success font-semibold">
                          Full Access
                        </span>
                      </div>
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <span className="font-semibold text-ink">
                          Loan Override, Disbursement &amp; Ticket Governance
                        </span>
                        <span className="text-success font-semibold">
                          Full Access
                        </span>
                      </div>
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <span className="font-semibold text-ink">
                          Portfolio CSV Reports, System Audit Logs &amp; JSON
                          Backups
                        </span>
                        <span className="text-success font-semibold">
                          Full Access
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
