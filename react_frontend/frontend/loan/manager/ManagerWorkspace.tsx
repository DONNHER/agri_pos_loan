import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Home, MessageSquare, User } from 'lucide-react';
import { SidebarNavItem } from '../layout/AppLayout';
import {
  LoanRequestStatus,
  PlatformState,
  PlatformUser,
  SupportTicketItem,
  TicketStatus,
} from '../shared/creditData';
import { ProfileFocusTarget } from '../shared/components/ProfileView';
import { ManagerApprovalsView } from './ManagerApprovalsView';
import { ManagerOverviewView } from './ManagerOverviewView';
import { ManagerProfileView } from './ManagerProfileView';
import { ManagerTicketsView } from './ManagerTicketsView';

export type ManagerTab = 'overview' | 'approvals' | 'tickets';
export type ManagerNavTab = ManagerTab | 'profile';

export interface ManagerFocusTarget {
  loanFilter?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  loanSearch?: string;
  ticketFilter?: 'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'FEEDBACK';
  ticketSearch?: string;
  nonce: number;
}

export function buildManagerNav(params: {
  activeTab: ManagerNavTab;
  managerFocus: ManagerFocusTarget | null;
  onSelectApprovalsFilter: (
    filter: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'
  ) => void;
  onSelectTicketsFilter: (
    filter: 'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'FEEDBACK'
  ) => void;
}): SidebarNavItem[] {
  const {
    activeTab,
    managerFocus,
    onSelectApprovalsFilter,
    onSelectTicketsFilter,
  } = params;

  return [
    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: Home },
    {
      id: 'approvals',
      label: 'Approvals',
      shortLabel: 'Approvals',
      icon: ClipboardCheck,
      subItems: [
        {
          id: 'mgr-approvals-pending',
          label: 'Pending Review',
          isActive:
            activeTab === 'approvals' &&
            (managerFocus?.loanFilter ?? 'PENDING') === 'PENDING',
          onSelect: () => onSelectApprovalsFilter('PENDING'),
        },
        {
          id: 'mgr-approvals-approved',
          label: 'Approved',
          isActive:
            activeTab === 'approvals' &&
            managerFocus?.loanFilter === 'APPROVED',
          onSelect: () => onSelectApprovalsFilter('APPROVED'),
        },
        {
          id: 'mgr-approvals-rejected',
          label: 'Declined',
          isActive:
            activeTab === 'approvals' &&
            managerFocus?.loanFilter === 'REJECTED',
          onSelect: () => onSelectApprovalsFilter('REJECTED'),
        },
        {
          id: 'mgr-approvals-all',
          label: 'All Requests',
          isActive:
            activeTab === 'approvals' && managerFocus?.loanFilter === 'ALL',
          onSelect: () => onSelectApprovalsFilter('ALL'),
        },
      ],
    },
    {
      id: 'tickets',
      label: 'Tickets',
      shortLabel: 'Tickets',
      icon: MessageSquare,
      subItems: [
        {
          id: 'mgr-tickets-all',
          label: 'All Tickets',
          isActive:
            activeTab === 'tickets' &&
            (managerFocus?.ticketFilter ?? 'ALL') === 'ALL',
          onSelect: () => onSelectTicketsFilter('ALL'),
        },
        {
          id: 'mgr-tickets-open',
          label: 'Open Queue',
          isActive:
            activeTab === 'tickets' && managerFocus?.ticketFilter === 'OPEN',
          onSelect: () => onSelectTicketsFilter('OPEN'),
        },
        {
          id: 'mgr-tickets-review',
          label: 'In Review',
          isActive:
            activeTab === 'tickets' &&
            managerFocus?.ticketFilter === 'IN_REVIEW',
          onSelect: () => onSelectTicketsFilter('IN_REVIEW'),
        },
        {
          id: 'mgr-tickets-resolved',
          label: 'Resolved',
          isActive:
            activeTab === 'tickets' &&
            managerFocus?.ticketFilter === 'RESOLVED',
          onSelect: () => onSelectTicketsFilter('RESOLVED'),
        },
      ],
    },
    { id: 'profile', label: 'Profile', shortLabel: 'Profile', icon: User },
  ];
}

interface ManagerWorkspaceProps {
  activeTab: ManagerNavTab;
  state: PlatformState;
  user: PlatformUser;
  balanceMasked: boolean;
  initialFocus?: ManagerFocusTarget | null;
  profileFocus?: ProfileFocusTarget | null;
  onNavigateTab: (tab: ManagerNavTab) => void;
  onToggleChecklist: (
    requestId: string,
    field: 'kycVerified' | 'shareCapitalChecked' | 'repaymentCapacityChecked'
  ) => void;
  onDecideLoanRequest: (
    requestId: string,
    decision: LoanRequestStatus.APPROVED | LoanRequestStatus.REJECTED,
    reviewNote: string
  ) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
  onProfileSectionChange?: (section: 'account' | 'tickets') => void;
  onCompleteBoostTask: (taskId: string) => void;
  onOpenAddChannel: () => void;
  onOpenChangePin: () => void;
  onOpenEditProfile: () => void;
  onSubmitTicketOrFeedback: (payload: {
    kind: 'TICKET' | 'FEEDBACK';
    category: SupportTicketItem['category'];
    priority: SupportTicketItem['priority'];
    rating?: number;
    subject: string;
    description: string;
    relatedLoanRef?: string;
  }) => void;
  onResetDemo: () => void;
  onLogout: () => void;
}

export const ManagerWorkspace: React.FC<ManagerWorkspaceProps> = ({
  activeTab,
  state,
  user,
  balanceMasked,
  initialFocus,
  profileFocus,
  onNavigateTab,
  onToggleChecklist,
  onDecideLoanRequest,
  onUpdateTicketStatus,
  onReplyTicket,
  onProfileSectionChange,
  onCompleteBoostTask,
  onOpenAddChannel,
  onOpenChangePin,
  onOpenEditProfile,
  onSubmitTicketOrFeedback,
  onResetDemo,
  onLogout,
}) => {
  const [loanFilter, setLoanFilter] = useState<
    'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'
  >(initialFocus?.loanFilter || 'PENDING');
  const [loanSearch, setLoanSearch] = useState(initialFocus?.loanSearch || '');

  const [ticketFilter, setTicketFilter] = useState<
    'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'FEEDBACK'
  >(initialFocus?.ticketFilter || 'ALL');
  const [ticketSearch, setTicketSearch] = useState(
    initialFocus?.ticketSearch || ''
  );

  useEffect(() => {
    if (!initialFocus) return;
    if (initialFocus.loanFilter) setLoanFilter(initialFocus.loanFilter);
    if (initialFocus.loanSearch !== undefined) {
      setLoanSearch(initialFocus.loanSearch);
    }
    if (initialFocus.ticketFilter) setTicketFilter(initialFocus.ticketFilter);
    if (initialFocus.ticketSearch !== undefined) {
      setTicketSearch(initialFocus.ticketSearch);
    }
  }, [initialFocus?.nonce]);

  if (activeTab === 'overview') {
    return (
      <ManagerOverviewView state={state} onNavigateTab={onNavigateTab} />
    );
  }

  if (activeTab === 'approvals') {
    return (
      <ManagerApprovalsView
        state={state}
        loanFilter={loanFilter}
        loanSearch={loanSearch}
        onChangeLoanFilter={setLoanFilter}
        onChangeLoanSearch={setLoanSearch}
        onToggleChecklist={onToggleChecklist}
        onDecideLoanRequest={onDecideLoanRequest}
      />
    );
  }

  if (activeTab === 'tickets') {
    return (
      <ManagerTicketsView
        state={state}
        ticketFilter={ticketFilter}
        ticketSearch={ticketSearch}
        onChangeTicketFilter={setTicketFilter}
        onChangeTicketSearch={setTicketSearch}
        onUpdateTicketStatus={onUpdateTicketStatus}
        onReplyTicket={onReplyTicket}
      />
    );
  }

  return (
    <ManagerProfileView
      state={state}
      user={user}
      balanceMasked={balanceMasked}
      initialFocus={profileFocus}
      onSectionChange={onProfileSectionChange}
      onCompleteBoostTask={onCompleteBoostTask}
      onOpenAddChannel={onOpenAddChannel}
      onOpenChangePin={onOpenChangePin}
      onOpenEditProfile={onOpenEditProfile}
      onSubmitTicketOrFeedback={onSubmitTicketOrFeedback}
      onReplyTicket={onReplyTicket}
      onResetDemo={onResetDemo}
      onLogout={onLogout}
    />
  );
};
