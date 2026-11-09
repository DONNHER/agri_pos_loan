import React from 'react';
import { Home, ReceiptText, User, Wallet } from 'lucide-react';
import { SidebarNavItem } from '../layout/AppLayout';
import {
  CreditPlan,
  InstallmentItem,
  LedgerEntry,
  LoanRequestItem,
  PlatformState,
  PlatformUser,
  SupportTicketItem,
  TenorMonths,
} from '../shared/creditData';
import { ProfileFocusTarget } from '../shared/components/ProfileView';
import { BillsFocusTarget, BillsSubTab, BillsView } from './BillsView';
import { CashLoanView } from './CashLoanView';
import { HomeView } from './HomeView';
import { ShareholderProfileView } from './ShareholderProfileView';

export type ShareholderNavTab = 'home' | 'cashloan' | 'bills' | 'profile';

export function buildShareholderNav(params: {
  activeTab: ShareholderNavTab;
  billsSubTab: BillsSubTab;
  profileSubSection: 'account' | 'tickets';
  onSelectBillsSubTab: (subTab: BillsSubTab) => void;
  onSelectProfileSection: (section: 'account' | 'tickets') => void;
}): SidebarNavItem[] {
  const {
    activeTab,
    billsSubTab,
    profileSubSection,
    onSelectBillsSubTab,
    onSelectProfileSection,
  } = params;

  return [
    { id: 'home', label: 'Home', shortLabel: 'Home', icon: Home },
    {
      id: 'cashloan',
      label: 'Loan Request',
      shortLabel: 'Loans',
      icon: Wallet,
    },
    {
      id: 'bills',
      label: 'Pay & Bills',
      shortLabel: 'Bills',
      icon: ReceiptText,
      subItems: [
        {
          id: 'bills-upcoming',
          label: 'Upcoming Bills',
          isActive: activeTab === 'bills' && billsSubTab === 'upcoming',
          onSelect: () => onSelectBillsSubTab('upcoming'),
        },
        {
          id: 'bills-plans',
          label: 'Active Plans',
          isActive: activeTab === 'bills' && billsSubTab === 'plans',
          onSelect: () => onSelectBillsSubTab('plans'),
        },
        {
          id: 'bills-history',
          label: 'Transaction Ledger',
          isActive: activeTab === 'bills' && billsSubTab === 'history',
          onSelect: () => onSelectBillsSubTab('history'),
        },
      ],
    },
    {
      id: 'profile',
      label: 'Profile',
      shortLabel: 'Profile',
      icon: User,
      subItems: [
        {
          id: 'profile-account',
          label: 'Account & Payouts',
          isActive: activeTab === 'profile' && profileSubSection === 'account',
          onSelect: () => onSelectProfileSection('account'),
        },
        {
          id: 'profile-tickets',
          label: 'Tickets & Feedback',
          isActive: activeTab === 'profile' && profileSubSection === 'tickets',
          onSelect: () => onSelectProfileSection('tickets'),
        },
      ],
    },
  ];
}

interface ShareholderWorkspaceProps {
  activeTab: ShareholderNavTab;
  state: PlatformState;
  user: PlatformUser;
  balanceMasked: boolean;
  billsFocus: BillsFocusTarget | null;
  profileFocus: ProfileFocusTarget | null;
  onToggleMask: () => void;
  onSelectTab: (tab: ShareholderNavTab) => void;
  onBillsSubTabChange: (subTab: BillsSubTab) => void;
  onProfileSectionChange: (section: 'account' | 'tickets') => void;
  onRequestCashLoan: (
    amount: number,
    tenor: TenorMonths,
    channelId: string,
    purpose: string
  ) => void;
  onInspectLoanRequest: (req: LoanRequestItem) => void;
  onOpenPayInstallment: (inst: InstallmentItem) => void;
  onEarlySettlePlan: (plan: CreditPlan) => void;
  onOpenReceipt: (entry: LedgerEntry) => void;
  onCompleteBoostTask: (taskId: string) => void;
  onSetDefaultChannel: (channelId: string) => void;
  onRemoveChannel: (channelId: string) => void;
  onOpenAddChannel: () => void;
  onOpenChangePin: () => void;
  onOpenEditProfile: () => void;
  onRelaunchOnboarding: () => void;
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
  onResetDemo: () => void;
  onLogout: () => void;
}

export const ShareholderWorkspace: React.FC<ShareholderWorkspaceProps> = ({
  activeTab,
  state,
  user,
  balanceMasked,
  billsFocus,
  profileFocus,
  onToggleMask,
  onSelectTab,
  onBillsSubTabChange,
  onProfileSectionChange,
  onRequestCashLoan,
  onInspectLoanRequest,
  onOpenPayInstallment,
  onEarlySettlePlan,
  onOpenReceipt,
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
  onResetDemo,
  onLogout,
}) => {
  if (activeTab === 'home') {
    return (
      <HomeView
        state={state}
        user={user}
        balanceMasked={balanceMasked}
        onToggleMask={onToggleMask}
      />
    );
  }

  if (activeTab === 'cashloan') {
    return (
      <CashLoanView
        state={state}
        user={user}
        onRequestCashLoan={onRequestCashLoan}
        onInspectLoanRequest={onInspectLoanRequest}
        onOpenAddChannel={onOpenAddChannel}
        onNavigateBills={() => onSelectTab('bills')}
      />
    );
  }

  if (activeTab === 'bills') {
    return (
      <BillsView
        state={state}
        user={user}
        balanceMasked={balanceMasked}
        initialFocus={billsFocus}
        onSubTabChange={onBillsSubTabChange}
        onOpenPayInstallment={onOpenPayInstallment}
        onEarlySettlePlan={onEarlySettlePlan}
        onOpenReceipt={onOpenReceipt}
        onNavigateCashLoan={() => onSelectTab('cashloan')}
      />
    );
  }

  return (
    <ShareholderProfileView
      state={state}
      user={user}
      balanceMasked={balanceMasked}
      initialFocus={profileFocus}
      onSectionChange={onProfileSectionChange}
      onCompleteBoostTask={onCompleteBoostTask}
      onSetDefaultChannel={onSetDefaultChannel}
      onRemoveChannel={onRemoveChannel}
      onOpenAddChannel={onOpenAddChannel}
      onOpenChangePin={onOpenChangePin}
      onOpenEditProfile={onOpenEditProfile}
      onRelaunchOnboarding={onRelaunchOnboarding}
      onChangeStatementDay={onChangeStatementDay}
      onSubmitTicketOrFeedback={onSubmitTicketOrFeedback}
      onReplyTicket={onReplyTicket}
      onResetDemo={onResetDemo}
      onLogout={onLogout}
    />
  );
};
