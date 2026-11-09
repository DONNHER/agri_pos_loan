import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  ClipboardCheck,
  Database,
  User,
  Users,
} from 'lucide-react';
import { SidebarNavItem } from '../layout/AppLayout';
import {
  BackupSnapshot,
  LoanRequestStatus,
  PlatformState,
  PlatformUser,
  SupportTicketItem,
  TicketStatus,
  UserRole,
} from '../shared/creditData';
import { ProfileFocusTarget } from '../shared/components/ProfileView';
import { AdminLoansView } from './AdminLoansView';
import { AdminLogsBackupsView } from './AdminLogsBackupsView';
import { AdminProfileView } from './AdminProfileView';
import { AdminReportsView } from './AdminReportsView';
import { AdminUsersView } from './AdminUsersView';

export type AdminTab = 'users' | 'loans' | 'reports' | 'logs';
export type AdminNavTab = AdminTab | 'profile';

export interface AdminFocusTarget {
  userSearch?: string;
  loanFilter?: 'ALL' | LoanRequestStatus;
  loanSearch?: string;
  reportsSubView?: 'analytics' | 'feedbacks';
  ticketRef?: string;
  opsSubView?: 'logs' | 'backups';
  backupChecksum?: string;
  nonce: number;
}

export function buildAdminNav(params: {
  activeTab: AdminNavTab;
  adminFocus: AdminFocusTarget | null;
  adminSubLabel: string | null;
  onSelectLoanFilter: (filter: 'ALL' | LoanRequestStatus) => void;
  onSelectReportsSubView: (subView: 'analytics' | 'feedbacks') => void;
  onSelectOpsSubView: (subView: 'logs' | 'backups') => void;
}): SidebarNavItem[] {
  const {
    activeTab,
    adminFocus,
    adminSubLabel,
    onSelectLoanFilter,
    onSelectReportsSubView,
    onSelectOpsSubView,
  } = params;

  return [
    { id: 'users', label: 'Users', shortLabel: 'Users', icon: Users },
    {
      id: 'loans',
      label: 'Loans',
      shortLabel: 'Loans',
      icon: ClipboardCheck,
      subItems: [
        {
          id: 'adm-loans-all',
          label: 'All Loans',
          isActive:
            activeTab === 'loans' &&
            (adminFocus?.loanFilter ?? 'ALL') === 'ALL',
          onSelect: () => onSelectLoanFilter('ALL'),
        },
        {
          id: 'adm-loans-pending',
          label: 'Pending Queue',
          isActive:
            activeTab === 'loans' &&
            adminFocus?.loanFilter === LoanRequestStatus.PENDING,
          onSelect: () => onSelectLoanFilter(LoanRequestStatus.PENDING),
        },
        {
          id: 'adm-loans-approved',
          label: 'Approved',
          isActive:
            activeTab === 'loans' &&
            adminFocus?.loanFilter === LoanRequestStatus.APPROVED,
          onSelect: () => onSelectLoanFilter(LoanRequestStatus.APPROVED),
        },
        {
          id: 'adm-loans-rejected',
          label: 'Declined',
          isActive:
            activeTab === 'loans' &&
            adminFocus?.loanFilter === LoanRequestStatus.REJECTED,
          onSelect: () => onSelectLoanFilter(LoanRequestStatus.REJECTED),
        },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      shortLabel: 'Reports',
      icon: BarChart3,
      subItems: [
        {
          id: 'adm-reports-portfolio',
          label: 'Portfolio Reports',
          isActive:
            activeTab === 'reports' && adminSubLabel === 'Portfolio Reports',
          onSelect: () => onSelectReportsSubView('analytics'),
        },
        {
          id: 'adm-reports-feedbacks',
          label: 'Feedbacks & Tickets',
          isActive:
            activeTab === 'reports' && adminSubLabel === 'Feedbacks & Tickets',
          onSelect: () => onSelectReportsSubView('feedbacks'),
        },
      ],
    },
    {
      id: 'logs',
      label: 'Logs & Backups',
      shortLabel: 'Logs',
      icon: Database,
      subItems: [
        {
          id: 'adm-ops-logs',
          label: 'Audit Logs',
          isActive: activeTab === 'logs' && adminSubLabel === 'Audit Logs',
          onSelect: () => onSelectOpsSubView('logs'),
        },
        {
          id: 'adm-ops-backups',
          label: 'Backups & Recovery',
          isActive:
            activeTab === 'logs' && adminSubLabel === 'Backups & Recovery',
          onSelect: () => onSelectOpsSubView('backups'),
        },
      ],
    },
    { id: 'profile', label: 'Profile', shortLabel: 'Profile', icon: User },
  ];
}

interface AdminWorkspaceProps {
  activeTab: AdminNavTab;
  state: PlatformState;
  user: PlatformUser;
  balanceMasked: boolean;
  currentAdminId: string;
  initialFocus?: AdminFocusTarget | null;
  profileFocus?: ProfileFocusTarget | null;
  onImpersonateUser: (targetUserId: string) => void;
  onCreateUser: (payload: {
    fullName: string;
    handle: string;
    email: string;
    phone: string;
    role: UserRole;
    totalLimit: number;
    shareCapital: number;
  }) => void;
  onUpdateUserAdmin: (
    userId: string,
    updates: {
      role: UserRole;
      status: 'ACTIVE' | 'SUSPENDED';
      totalLimit: number;
      shareCapital: number;
      kycVerified: boolean;
    }
  ) => void;
  onResetUserPin: (userId: string) => void;
  onDecideLoanRequest: (
    requestId: string,
    decision: LoanRequestStatus.APPROVED | LoanRequestStatus.REJECTED,
    reviewNote: string
  ) => void;
  onReopenLoanRequest: (requestId: string) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
  onCreateBackupSnapshot: (label: string) => void;
  onRestoreBackupSnapshot: (snapshot: BackupSnapshot) => void;
  onImportJsonBackup: (jsonContent: string) => void;
  onSubViewChange?: (subLabel: string | null) => void;
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
  onResetFactorySeed: () => void;
  onLogout: () => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  activeTab,
  state,
  user,
  balanceMasked,
  currentAdminId,
  initialFocus,
  profileFocus,
  onImpersonateUser,
  onCreateUser,
  onUpdateUserAdmin,
  onResetUserPin,
  onDecideLoanRequest,
  onReopenLoanRequest,
  onUpdateTicketStatus,
  onReplyTicket,
  onCreateBackupSnapshot,
  onRestoreBackupSnapshot,
  onImportJsonBackup,
  onSubViewChange,
  onProfileSectionChange,
  onCompleteBoostTask,
  onOpenAddChannel,
  onOpenChangePin,
  onOpenEditProfile,
  onSubmitTicketOrFeedback,
  onResetFactorySeed,
  onLogout,
}) => {
  const [userSearch, setUserSearch] = useState(initialFocus?.userSearch || '');
  const [loanStatusFilter, setLoanStatusFilter] = useState<
    'ALL' | LoanRequestStatus
  >(initialFocus?.loanFilter || 'ALL');
  const [loanSearch, setLoanSearch] = useState(initialFocus?.loanSearch || '');
  const [reportsSubView, setReportsSubView] = useState<
    'analytics' | 'feedbacks'
  >(initialFocus?.reportsSubView || 'analytics');
  const [focusedTicketRef, setFocusedTicketRef] = useState<string | undefined>(
    initialFocus?.ticketRef
  );
  const [opsSubView, setOpsSubView] = useState<'logs' | 'backups'>(
    initialFocus?.opsSubView || 'logs'
  );
  const [focusedBackupChecksum, setFocusedBackupChecksum] = useState<
    string | undefined
  >(initialFocus?.backupChecksum);

  useEffect(() => {
    if (!initialFocus) return;
    if (initialFocus.userSearch !== undefined) {
      setUserSearch(initialFocus.userSearch);
    }
    if (initialFocus.loanFilter) setLoanStatusFilter(initialFocus.loanFilter);
    if (initialFocus.loanSearch !== undefined) {
      setLoanSearch(initialFocus.loanSearch);
    }
    if (initialFocus.reportsSubView) {
      setReportsSubView(initialFocus.reportsSubView);
    }
    setFocusedTicketRef(initialFocus.ticketRef);
    if (initialFocus.opsSubView) setOpsSubView(initialFocus.opsSubView);
    setFocusedBackupChecksum(initialFocus.backupChecksum);
  }, [initialFocus?.nonce]);

  useEffect(() => {
    if (!onSubViewChange) return;
    if (activeTab === 'reports') {
      onSubViewChange(
        reportsSubView === 'feedbacks'
          ? 'Feedbacks & Tickets'
          : 'Portfolio Reports'
      );
    } else if (activeTab === 'logs') {
      onSubViewChange(
        opsSubView === 'backups' ? 'Backups & Recovery' : 'Audit Logs'
      );
    } else {
      onSubViewChange(null);
    }
  }, [activeTab, reportsSubView, opsSubView, onSubViewChange]);

  if (activeTab === 'users') {
    return (
      <AdminUsersView
        state={state}
        currentAdminId={currentAdminId}
        userSearch={userSearch}
        onChangeUserSearch={setUserSearch}
        onImpersonateUser={onImpersonateUser}
        onCreateUser={onCreateUser}
        onUpdateUserAdmin={onUpdateUserAdmin}
        onResetUserPin={onResetUserPin}
      />
    );
  }

  if (activeTab === 'loans') {
    return (
      <AdminLoansView
        state={state}
        loanStatusFilter={loanStatusFilter}
        loanSearch={loanSearch}
        onChangeLoanStatusFilter={setLoanStatusFilter}
        onChangeLoanSearch={setLoanSearch}
        onDecideLoanRequest={onDecideLoanRequest}
        onReopenLoanRequest={onReopenLoanRequest}
      />
    );
  }

  if (activeTab === 'reports') {
    return (
      <AdminReportsView
        state={state}
        reportsSubView={reportsSubView}
        focusedTicketRef={focusedTicketRef}
        onChangeReportsSubView={setReportsSubView}
        onClearFocusedTicket={() => setFocusedTicketRef(undefined)}
        onUpdateTicketStatus={onUpdateTicketStatus}
        onReplyTicket={onReplyTicket}
      />
    );
  }

  if (activeTab === 'logs') {
    return (
      <AdminLogsBackupsView
        state={state}
        opsSubView={opsSubView}
        focusedBackupChecksum={focusedBackupChecksum}
        onChangeOpsSubView={setOpsSubView}
        onClearFocusedBackup={() => setFocusedBackupChecksum(undefined)}
        onCreateBackupSnapshot={onCreateBackupSnapshot}
        onRestoreBackupSnapshot={onRestoreBackupSnapshot}
        onImportJsonBackup={onImportJsonBackup}
        onResetFactorySeed={onResetFactorySeed}
      />
    );
  }

  return (
    <AdminProfileView
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
      onResetDemo={onResetFactorySeed}
      onLogout={onLogout}
    />
  );
};
