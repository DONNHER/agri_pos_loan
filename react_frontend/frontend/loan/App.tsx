/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  AuditCategory,
  AuditLogEntry,
  BackupSnapshot,
  calculateLoanQuote,
  computeUserCreditSummary,
  CreditPlan,
  createInitialPlatformState,
  formatNowTimestamp,
  formatPHP,
  getRoleLabel,
  InstallmentItem,
  InstallmentStatus,
  LedgerEntry,
  LinkedChannel,
  LoanRequestItem,
  LoanRequestStatus,
  NotificationCategory,
  NotificationItem,
  PlanType,
  PlatformState,
  SupportTicketItem,
  TenorMonths,
  TicketStatus,
  UserRole,
} from './shared/creditData';
import { PosWorkspace } from '../pos/PosWorkspace';
import { buildPosNav, PosSubTab } from '../pos/posNavigation';
import { LoginView } from './auth/LoginView';
import {
  AppLayout,
  AuthLayout,
  SubBreadcrumbTarget,
} from './layout/AppLayout';
import { NotificationDropdown } from './shared/components/NotificationDropdown';
import { ProfileFocusTarget } from './shared/components/ProfileView';
import {
  AddChannelModal,
  ChangePinModal,
  EditProfileModal,
  LoanRequestDetailModal,
  PinVerificationModal,
  ReceiptModal,
  RepaymentModal,
} from './shared/components/CreditModals';
import { OnboardingWizard } from './shareholder/OnboardingWizard';
import { BillsFocusTarget, BillsSubTab } from './shareholder/BillsView';
import {
  buildShareholderNav,
  ShareholderNavTab,
  ShareholderWorkspace,
} from './shareholder/ShareholderWorkspace';
import {
  buildManagerNav,
  ManagerFocusTarget,
  ManagerNavTab,
  ManagerWorkspace,
} from './manager/ManagerWorkspace';
import {
  AdminFocusTarget,
  AdminNavTab,
  AdminWorkspace,
  buildAdminNav,
} from './admin/AdminWorkspace';
import { AuthProvider, useAuth, useApi, useMutation } from './shared/AuthContext';
import { api, type ApiError } from './shared/api';

// ============================================
// Lazy-loaded components for code splitting
// ============================================

const ShareholderWorkspaceLazy = lazy(() => import('./shareholder/ShareholderWorkspace').then(m => ({ default: m.ShareholderWorkspace })));
const ManagerWorkspaceLazy = lazy(() => import('./manager/ManagerWorkspace').then(m => ({ default: m.ManagerWorkspace })));
const AdminWorkspaceLazy = lazy(() => import('./admin/AdminWorkspace').then(m => ({ default: m.AdminWorkspace })));
const PosWorkspaceLazy = lazy(() => import('../pos/PosWorkspace').then(m => ({ default: m.PosWorkspace })));

// ============================================
// Types
// ============================================

interface PendingPinAction {
  summary: string;
  amountLabel: string;
  execute: () => void;
}

interface AppState {
  // Platform state (synced with backend)
  users: PlatformUser[];
  loanRequests: LoanRequestItem[];
  plans: CreditPlan[];
  ledger: LedgerEntry[];
  tickets: SupportTicketItem[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  backups: BackupSnapshot[];
  
  // UI state
  activeUserId: string | null;
  impersonatorAdminId: string | null;
  
  // Loading states
  isLoading: boolean;
  error: ApiError | null;
}

// ============================================
// Initial State
// ============================================

const initialAppState: AppState = {
  users: [],
  loanRequests: [],
  plans: [],
  ledger: [],
  tickets: [],
  notifications: [],
  auditLogs: [],
  backups: [],
  activeUserId: null,
  impersonatorAdminId: null,
  isLoading: true,
  error: null,
};

// ============================================
// Main App Component (with Auth Provider)
// ============================================

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

// ============================================
// Inner App Component (with auth context)
// ============================================

function AppInner() {
  const { user: activeUser, isAuthenticated, isLoading: authLoading, logout, refreshUser } = useAuth();
  const [state, setState] = useState<AppState>(initialAppState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // UI State
  const [shareholderTab, setShareholderTab] = useState<ShareholderNavTab>('home');
  const [managerTab, setManagerTab] = useState<ManagerNavTab>('overview');
  const [adminTab, setAdminTab] = useState<AdminNavTab>('users');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [posTab, setPosTab] = useState<PosSubTab>('checkout');
  const [balanceMasked, setBalanceMasked] = useState(false);

  // Modals & Focus Targets
  const [pendingPinAction, setPendingPinAction] = useState<PendingPinAction | null>(null);
  const [repayInstallment, setRepayInstallment] = useState<InstallmentItem | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<LedgerEntry | null>(null);
  const [selectedLoanRequest, setSelectedLoanRequest] = useState<LoanRequestItem | null>(null);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const [billsFocus, setBillsFocus] = useState<BillsFocusTarget | null>(null);
  const [profileFocus, setProfileFocus] = useState<ProfileFocusTarget | null>(null);
  const [managerFocus, setManagerFocus] = useState<ManagerFocusTarget | null>(null);
  const [adminFocus, setAdminFocus] = useState<AdminFocusTarget | null>(null);

  const [billsSubTab, setBillsSubTab] = useState<BillsSubTab>('upcoming');
  const [profileSubSection, setProfileSubSection] = useState<'account' | 'tickets'>('account');
  const [adminSubLabel, setAdminSubLabel] = useState<string | null>(null);

  // ============================================
  // API Mutations
  // ============================================

  const loginMutation = useMutation(api.login.bind(api));
  const registerMutation = useMutation(api.register.bind(api));
  const logoutMutation = useMutation(api.logout.bind(api));
  const getCurrentUserMutation = useMutation(api.getCurrentUser.bind(api));
  const updateProfileMutation = useMutation(api.updateProfile.bind(api));
  const changePasswordMutation = useMutation(api.changePassword.bind(api));
  const forgotPasswordMutation = useMutation(api.forgotPassword.bind(api));
  const resetPasswordMutation = useMutation(api.resetPassword.bind(api));
  const verifyMfaMutation = useMutation(api.verifyMfa.bind(api));
  const resendMfaMutation = useMutation(api.resendMfa.bind(api));
  const offlineLoginMutation = useMutation(api.offlineLogin.bind(api));

  // Shareholder mutations
  const getShareholdersMutation = useMutation(api.getShareholders.bind(api));
  const createShareholderMutation = useMutation(api.createShareholder.bind(api));
  const updateShareholderMutation = useMutation(api.updateShareholder.bind(api));
  const updateShareholderCapitalMutation = useMutation(api.updateShareholderCapital.bind(api));
  const deleteShareholderMutation = useMutation(api.deleteShareholder.bind(api));

  // Loan mutations
  const getLoanRequestsMutation = useMutation(api.getLoanRequests.bind(api));
  const createLoanRequestMutation = useMutation(api.createLoanRequest.bind(api));
  const updateLoanRequestStatusMutation = useMutation(api.updateLoanRequestStatus.bind(api));
  const setComakerDecisionMutation = useMutation(api.setComakerDecision.bind(api));
  const disburseLoanMutation = useMutation(api.disburseLoan.bind(api));
  const getLoansMutation = useMutation(api.getLoans.bind(api));
  const getLoanPaymentsMutation = useMutation(api.getLoanPayments.bind(api));
  const recordLoanPaymentMutation = useMutation(api.recordLoanPayment.bind(api));
  const getLoansByShareholderMutation = useMutation(api.getLoansByShareholder.bind(api));

  // Transaction mutations
  const getTransactionsMutation = useMutation(api.getTransactions.bind(api));
  const createTransactionMutation = useMutation(api.createTransaction.bind(api));

  // Dashboard mutations
  const getDashboardStatsMutation = useMutation(api.getDashboardStats.bind(api));
  const getLoanChartMutation = useMutation(api.getLoanChart.bind(api));
  const getShareCapitalChartMutation = useMutation(api.getShareCapitalChart.bind(api));
  const getRecentLoansMutation = useMutation(api.getRecentLoans.bind(api));
  const getRecentTransactionsMutation = useMutation(api.getRecentTransactions.bind(api));
  const getTopShareholdersMutation = useMutation(api.getTopShareholders.bind(api));

  // Notification mutations
  const getNotificationsMutation = useMutation(api.getNotifications.bind(api));
  const markNotificationAsReadMutation = useMutation(api.markNotificationAsRead.bind(api));
  const markAllNotificationsAsReadMutation = useMutation(api.markAllNotificationsAsRead.bind(api));
  const deleteAllNotificationsMutation = useMutation(api.deleteAllNotifications.bind(api));
  const sendEmailMutation = useMutation(api.sendEmail.bind(api));

  // Activity log mutations
  const getActivityLogsMutation = useMutation(api.getActivityLogs.bind(api));
  const createActivityLogMutation = useMutation(api.createActivityLog.bind(api));
  const exportActivityLogsMutation = useMutation(api.exportActivityLogs.bind(api));
  const cleanupActivityLogsMutation = useMutation(api.cleanupActivityLogs.bind(api));

  // File upload
  const uploadFileMutation = useMutation(api.uploadFile.bind(api));

  // Import/Export
  const exportDataMutation = useMutation(api.exportData.bind(api));
  const previewImportMutation = useMutation(api.previewImport.bind(api));
  const confirmImportMutation = useMutation(api.confirmImport.bind(api));
  const downloadErrorReportMutation = useMutation(api.downloadErrorReport.bind(api));

  // Backup
  const getBackupSettingsMutation = useMutation(api.getBackupSettings.bind(api));
  const updateBackupSettingsMutation = useMutation(api.updateBackupSettings.bind(api));
  const runManualBackupMutation = useMutation(api.runManualBackup.bind(api));
  const listBackupsMutation = useMutation(api.listBackups.bind(api));

  // Admin users
  const getAdminUsersMutation = useMutation(api.getAdminUsers.bind(api));
  const createAdminUserMutation = useMutation(api.createAdminUser.bind(api));
  const updateAdminUserMutation = useMutation(api.updateAdminUser.bind(api));
  const deleteAdminUserMutation = useMutation(api.deleteAdminUser.bind(api));
  const bulkDeleteUsersMutation = useMutation(api.bulkDeleteUsers.bind(api));
  const getUserLoginHistoryMutation = useMutation(api.getUserLoginHistory.bind(api));
  const impersonateUserMutation = useMutation(api.impersonateUser.bind(api));
  const updateUserStatusMutation = useMutation(api.updateUserStatus.bind(api));
  const updateUserAddressMutation = useMutation(api.updateUserAddress.bind(api));

  // POS
  const getPosCatalogMutation = useMutation(api.getPosCatalog.bind(api));
  const recordPosSaleMutation = useMutation(api.recordPosSale.bind(api));
  const syncPosMutation = useMutation(api.syncPos.bind(api));
  const getPosStatusMutation = useMutation(api.getPosStatus.bind(api));

  // Products
  const getProductsMutation = useMutation(api.getProducts.bind(api));
  const createProductMutation = useMutation(api.createProduct.bind(api));
  const updateProductMutation = useMutation(api.updateProduct.bind(api));
  const deleteProductMutation = useMutation(api.deleteProduct.bind(api));
  const restoreProductMutation = useMutation(api.restoreProduct.bind(api));
  const bulkActionProductsMutation = useMutation(api.bulkActionProducts.bind(api));
  const getProductBatchesMutation = useMutation(api.getProductBatches.bind(api));

  // Consignees
  const getConsigneesMutation = useMutation(api.getConsignees.bind(api));
  const searchConsigneesMutation = useMutation(api.searchConsignees.bind(api));
  const createConsigneeMutation = useMutation(api.createConsignee.bind(api));
  const updateConsigneeMutation = useMutation(api.updateConsignee.bind(api));
  const deleteConsigneeMutation = useMutation(api.deleteConsignee.bind(api));
  const restoreConsigneeMutation = useMutation(api.restoreConsignee.bind(api));
  const bulkActionConsigneesMutation = useMutation(api.bulkActionConsignees.bind(api));
  const exportConsigneesMutation = useMutation(api.exportConsignees.bind(api));

  // Reports
  const getAvailableReportsMutation = useMutation(api.getAvailableReports.bind(api));
  const generateReportMutation = useMutation(api.generateReport.bind(api));
  const downloadReportMutation = useMutation(api.downloadReport.bind(api));
  const getReportPreferencesMutation = useMutation(api.getReportPreferences.bind(api));
  const saveReportPreferenceMutation = useMutation(api.saveReportPreference.bind(api));
  const scheduleReportEmailMutation = useMutation(api.scheduleReportEmail.bind(api));

  // ============================================
  // Data Fetching Hooks
  // ============================================

  // Fetch initial platform data when authenticated
  const { data: platformData, isLoading: platformLoading, error: platformError, execute: fetchPlatformData } = useApi(
    async () => {
      const [users, loanRequests, plans, ledger, tickets, notifications, auditLogs, backups] = await Promise.all([
        api.getShareholders(),
        api.getLoanRequests(),
        api.getLoans(),
        api.getTransactions(),
        api.getActivityLogs().then(r => r.data as unknown as AuditLogEntry[]),
        api.getNotifications(activeUser?.id || '').catch(() => []),
        api.getActivityLogs({ limit: 100 }).then(r => r.data as unknown as AuditLogEntry[]),
        api.listBackups(),
      ]);
      return { users, loanRequests, plans, ledger, tickets, notifications, auditLogs, backups };
    },
    [activeUser?.id]
  );

  // Fetch dashboard stats
  const { data: dashboardStats } = useApi(
    () => api.getDashboardStats('week'),
    [activeUser?.id]
  );

  // Fetch loan chart
  const { data: loanChart } = useApi(
    () => api.getLoanChart('month'),
    [activeUser?.id]
  );

  // Fetch share capital chart
  const { data: shareCapitalChart } = useApi(
    () => api.getShareCapitalChart('month'),
    [activeUser?.id]
  );

  // ============================================
  // Effects
  // ============================================

  // Load platform data when user authenticates
  useEffect(() => {
    if (isAuthenticated && activeUser) {
      fetchPlatformData();
    } else if (!isAuthenticated) {
      setState(initialAppState);
    }
  }, [isAuthenticated, activeUser, fetchPlatformData]);

  // Update state when platform data loads
  useEffect(() => {
    if (platformData) {
      setState(prev => ({
        ...prev,
        ...platformData,
        isLoading: false,
        error: null,
      }));
    }
  }, [platformData]);

  // Handle platform loading error
  useEffect(() => {
    if (platformError) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: platformError,
      }));
    }
  }, [platformError]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = useCallback((msg: string) => setToastMessage(msg), []);

  // ============================================
  // Computed Values
  // ============================================

  const impersonatorAdmin = state.impersonatorAdminId
    ? state.users.find(u => u.id === state.impersonatorAdminId) || null
    : null;

  const activeSummary = activeUser ? computeUserCreditSummary(
    {
      activeUserId: state.activeUserId,
      impersonatorAdminId: state.impersonatorAdminId,
      users: state.users,
      loanRequests: state.loanRequests,
      plans: state.plans,
      ledger: state.ledger,
      tickets: state.tickets,
      notifications: state.notifications,
      auditLogs: state.auditLogs,
      backups: state.backups,
    },
    activeUser.id
  ) : null;

  const unreadCount = activeSummary?.unreadNotificationsCount || 0;

  // ============================================
  // Helper Functions
  // ============================================

  const createAuditEntry = useCallback((
    actor: { fullName: string; handle: string; role: UserRole },
    category: AuditCategory,
    action: string,
    target: string,
    details: string,
    impersonatedByHandle?: string
  ): AuditLogEntry => ({
    id: `log-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    timestamp: formatNowTimestamp(),
    category,
    actorName: actor.fullName,
    actorHandle: actor.handle,
    actorRole: actor.role,
    impersonatedBy: impersonatedByHandle,
    action,
    target,
    details,
  }), []);

  const createNotification = useCallback((
    userId: string,
    category: NotificationCategory,
    title: string,
    message: string,
    referenceCode?: string
  ): NotificationItem => ({
    id: `ntf-${Date.now()}-${Math.floor(Math.random() * 99999)}`,
    userId,
    category,
    title,
    message,
    timestamp: formatNowTimestamp(),
    read: false,
    referenceCode,
  }), []);

  /* NOTIFICATION READ & DEEP-LINK REDIRECTION HANDLERS */
  const handleMarkNotificationRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
    markNotificationAsReadMutation.mutate(notificationId);
  }, [markNotificationAsReadMutation]);

  const handleMarkAllNotificationsRead = useCallback(() => {
    if (!activeUser) return;
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.userId === activeUser.id ? { ...n, read: true } : n
      ),
    }));
    markAllNotificationsAsReadMutation.mutate(activeUser.id);
    showToast('All notifications marked as read');
  }, [activeUser, markAllNotificationsAsReadMutation, showToast]);

  const handleSelectLoanRequest = useCallback((req: LoanRequestItem) => {
    if (!activeUser) return;
    const nonce = Date.now();
    setNotificationsOpen(false);

    if (activeUser.role === UserRole.SHAREHOLDER) {
      if (req.status === LoanRequestStatus.APPROVED) {
        setShareholderTab('bills');
        setBillsFocus({ subTab: 'plans', query: '', nonce });
      } else {
        setShareholderTab('cashloan');
      }
      setSelectedLoanRequest(req);
      return;
    }

    if (activeUser.role === UserRole.MANAGER) {
      setManagerTab('approvals');
      setManagerFocus({ loanFilter: req.status, loanSearch: req.referenceCode, nonce });
      showToast(`Opened ${req.referenceCode} in Loan Approvals`);
      return;
    }

    setAdminTab('loans');
    setAdminFocus({ loanFilter: req.status, loanSearch: req.referenceCode, nonce });
    showToast(`Opened ${req.referenceCode} in Loan Governance`);
  }, [activeUser, showToast]);

  const handleSelectLedgerEntry = useCallback((entry: LedgerEntry) => {
    if (!activeUser) return;
    setNotificationsOpen(false);
    if (activeUser.role === UserRole.SHAREHOLDER) {
      setShareholderTab('bills');
      setBillsFocus({
        subTab: entry.referenceCode.startsWith('TCL-') ? 'plans' : 'history',
        query: entry.referenceCode,
        nonce: Date.now(),
      });
    }
    setSelectedReceipt(entry);
  }, [activeUser]);

  const handleSelectNotification = useCallback((item: NotificationItem) => {
    if (!activeUser) return;
    if (!item.read) {
      handleMarkNotificationRead(item.id);
    }

    const nonce = Date.now();
    const ref = item.referenceCode || '';
    const titleLower = item.title.toLowerCase();

    setNotificationsOpen(false);

    // SHAREHOLDER DEEP-LINK REDIRECTION
    if (activeUser.role === UserRole.SHAREHOLDER) {
      if (item.category === 'PAYMENT') {
        const matchingLedger = ref
          ? state.ledger.find(l => l.userId === activeUser.id && l.referenceCode === ref)
          : undefined;

        if (ref.startsWith('PAY-') && matchingLedger) {
          setShareholderTab('bills');
          setBillsFocus({ subTab: 'history', query: ref, nonce });
          setSelectedReceipt(matchingLedger);
          return;
        }

        const matchingPlan = ref
          ? state.plans.find(p => p.userId === activeUser.id && p.referenceCode === ref)
          : undefined;
        setShareholderTab('bills');
        setBillsFocus({
          subTab: 'upcoming',
          query: matchingPlan ? matchingPlan.title : '',
          nonce,
        });
        showToast('Opened Upcoming Installment Bills');
        return;
      }

      if (item.category === 'APPROVAL' || ref.startsWith('TCL-')) {
        const matchingLedger = ref
          ? state.ledger.find(l => l.userId === activeUser.id && l.referenceCode === ref)
          : undefined;
        setShareholderTab('bills');
        setBillsFocus({ subTab: 'plans', query: ref, nonce });
        if (matchingLedger) {
          setSelectedReceipt(matchingLedger);
        } else {
          showToast(`Opened Active Plan ${ref}`);
        }
        return;
      }

      if (item.category === 'LOAN') {
        const matchingReq = ref
          ? state.loanRequests.find(r => r.userId === activeUser.id && r.referenceCode === ref)
          : undefined;
        setShareholderTab('cashloan');
        if (matchingReq) {
          setSelectedLoanRequest(matchingReq);
        } else {
          showToast('Opened Loan Request workspace');
        }
        return;
      }

      if (item.category === 'TICKET') {
        setShareholderTab('profile');
        setProfileFocus({ section: 'tickets', ticketRef: ref || undefined, nonce });
        showToast(ref ? `Opened thread ${ref} in Tickets & Feedback` : 'Opened Tickets & Feedback');
        return;
      }

      setShareholderTab('profile');
      setProfileFocus({ section: 'account', nonce });
      if (titleLower.includes('pin')) {
        setChangePinOpen(true);
      } else {
        showToast('Opened Profile & Credit Standing');
      }
      return;
    }

    // MANAGER DEEP-LINK REDIRECTION
    if (activeUser.role === UserRole.MANAGER) {
      if (item.category === 'APPROVAL' || item.category === 'LOAN') {
        const matchingReq = ref ? state.loanRequests.find(r => r.referenceCode === ref) : undefined;
        setManagerTab('approvals');
        setManagerFocus({ loanFilter: matchingReq ? matchingReq.status : 'PENDING', loanSearch: ref, nonce });
        showToast(ref ? `Focused loan ${ref} in Approvals Queue` : 'Opened Loan Approvals Queue');
        return;
      }

      if (item.category === 'TICKET') {
        setManagerTab('tickets');
        setManagerFocus({ ticketFilter: 'ALL', ticketSearch: ref, nonce });
        showToast(ref ? `Focused ticket ${ref} in Resolution Desk` : 'Opened Support Tickets');
        return;
      }

      setManagerTab('profile');
      showToast('Opened Manager Profile');
      return;
    }

    // ADMIN DEEP-LINK REDIRECTION
    if (item.category === 'APPROVAL' || item.category === 'LOAN') {
      const matchingReq = ref ? state.loanRequests.find(r => r.referenceCode === ref) : undefined;
      setAdminTab('loans');
      setAdminFocus({ loanFilter: matchingReq ? matchingReq.status : 'ALL', loanSearch: ref, nonce });
      showToast(ref ? `Focused ${ref} in Loan Governance` : 'Opened Loan Governance');
      return;
    }

    if (item.category === 'TICKET') {
      setAdminTab('reports');
      setAdminFocus({ reportsSubView: 'feedbacks', ticketRef: ref || undefined, nonce });
      showToast(ref ? `Opened ${ref} in Feedbacks & Tickets` : 'Opened Feedbacks & Tickets');
      return;
    }

    if (ref.startsWith('SHA256-') || titleLower.includes('snapshot') || titleLower.includes('backup')) {
      setAdminTab('logs');
      setAdminFocus({ opsSubView: 'backups', backupChecksum: ref || undefined, nonce });
      showToast(ref ? `Opened Snapshot ${ref} in Backups` : 'Opened Backups & Recovery');
      return;
    }

    if (ref.startsWith('SH-') || ref.startsWith('MGR-') || ref.startsWith('ADM-')) {
      setAdminTab('users');
      setAdminFocus({ userSearch: ref, nonce });
      showToast(`Filtered User Directory to ${ref}`);
      return;
    }

    setAdminTab('profile');
    showToast('Opened Admin Profile');
  }, [activeUser, state.ledger, state.plans, state.loanRequests, state.tickets, handleMarkNotificationRead, showToast]);

  /* AUTH & ONBOARDING HANDLERS */
  const handleLoginAsUser = useCallback(async (userId: string, triggerOnboarding = false) => {
    const target = state.users.find(u => u.id === userId);
    if (!target) return;

    if (target.status === 'SUSPENDED') {
      showToast('Account is currently suspended by Administrator');
      return;
    }

    setNotificationsOpen(false);

    // For demo: use local login, in production call API
    setState(prev => ({
      ...prev,
      activeUserId: target.id,
      impersonatorAdminId: null,
      users: triggerOnboarding
        ? prev.users.map(u => u.id === target.id ? { ...u, onboardingCompleted: false } : u)
        : prev.users,
      auditLogs: [
        createAuditEntry(target, 'AUTH', 'USER_LOGIN', target.accountId, `Signed into ${getRoleLabel(target.role)} workspace`),
        ...prev.auditLogs,
      ],
    }));

    if (target.role === UserRole.SHAREHOLDER) setShareholderTab('home');
    if (target.role === UserRole.MANAGER) setManagerTab('overview');
    if (target.role === UserRole.ADMIN) setAdminTab('users');
    if (target.role === UserRole.CASHIER) setIsPosOpen(true);

    showToast(`Signed in as ${target.fullName} (${getRoleLabel(target.role)})`);
  }, [state.users, showToast, createAuditEntry]);

  const handleRegisterNewMember = useCallback(async (payload: {
    fullName: string;
    handle: string;
    phone: string;
    email: string;
  }) => {
    const newId = `user-shareholder-${Date.now()}`;
    const acctId = `SH-${Math.floor(1000 + Math.random() * 9000)}-2026`;
    const newUser: PlatformUser = {
      id: newId,
      role: UserRole.SHAREHOLDER,
      status: 'ACTIVE',
      fullName: payload.fullName,
      handle: payload.handle,
      phone: payload.phone,
      email: payload.email,
      password: 'password123',
      accountId: acctId,
      avatarPath: '',
      kycVerified: false,
      onboardingCompleted: false,
      statementDay: 15,
      securityPin: '123456',
      autoDebitEnabled: false,
      totalLimit: 0,
      shareCapital: 12000,
      nationalId: '',
      cityAddress: '',
      incomeSource: 'Salaried · Digital Operations',
      monthlyIncome: 45000,
      channels: [],
      boostTasks: [
        {
          id: 'boost-kyc',
          title: 'Complete 3-Step KYC & National ID Onboarding',
          subtitle: 'Activates initial pre-qualified revolving credit ceiling',
          boostAmount: 0,
          completed: false,
          actionLabel: 'Pending Onboarding',
        },
        {
          id: 'boost-income',
          title: 'Upload Latest Monthly Payslip or Bank Statement',
          subtitle: 'Verify monthly income to boost cash credit ceiling',
          boostAmount: 10000,
          completed: false,
          actionLabel: 'Verify +₱10,000',
        },
        {
          id: 'boost-autodebit',
          title: 'Enable Auto-Debit on Primary Payout Account',
          subtitle: 'Automatic statement day settlement with ₱0 fee',
          boostAmount: 5000,
          completed: false,
          actionLabel: 'Enable +₱5,000',
        },
      ],
    };

    setNotificationsOpen(false);

    setState(prev => ({
      ...prev,
      activeUserId: newId,
      impersonatorAdminId: null,
      users: [newUser, ...prev.users],
      notifications: [
        createNotification(newId, 'ACCOUNT', 'Welcome to TikCredit', 'Complete your 3-step KYC onboarding to activate your revolving cash credit line.', acctId),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(newUser, 'ONBOARDING', 'SHAREHOLDER_REGISTERED', acctId, `Created new Shareholder account ${payload.handle} with zero loan history`),
        ...prev.auditLogs,
      ],
    }));

    setShareholderTab('home');
    showToast('Account created — complete 3-step Member Onboarding');
  }, [showToast, createNotification, createAuditEntry]);

  const handleCompleteOnboarding = useCallback(async (payload: {
    cityAddress: string;
    incomeSource: string;
    monthlyIncome: number;
    shareCapital: number;
    nationalId: string;
    payoutProvider: LinkedChannel['provider'];
    payoutAccountDigits: string;
    securityPin: string;
    activatedLimit: number;
  }) => {
    if (!activeUser) return;

    const targetMask = `•••• ${payload.payoutAccountDigits}`;
    const primaryChannel: LinkedChannel = {
      id: `ch-onb-${Date.now()}`,
      provider: payload.payoutProvider,
      accountMask: targetMask,
      accountHolder: activeUser.fullName,
      instantDisbursement: true,
      isDefault: true,
    };

    setState(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id !== activeUser.id) return u;
        const remainingChannels = u.channels
          .filter(c => !(c.provider === payload.payoutProvider && c.accountMask === targetMask))
          .map(c => ({ ...c, isDefault: false }));

        return {
          ...u,
          onboardingCompleted: true,
          kycVerified: true,
          cityAddress: payload.cityAddress,
          incomeSource: payload.incomeSource,
          monthlyIncome: payload.monthlyIncome,
          shareCapital: payload.shareCapital,
          nationalId: payload.nationalId,
          securityPin: payload.securityPin,
          totalLimit: payload.activatedLimit,
          channels: [primaryChannel, ...remainingChannels],
          boostTasks: u.boostTasks.map(t =>
            t.id === 'boost-kyc' ? { ...t, completed: true, actionLabel: 'Completed' } : t
          ),
        };
      }),
      notifications: [
        createNotification(activeUser.id, 'ACCOUNT', 'Revolving Credit Line Activated', `Your ${formatPHP(payload.activatedLimit)} cash loan limit is active with instant payout to ${payload.payoutProvider} •••• ${payload.payoutAccountDigits}.`, activeUser.accountId),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(activeUser, 'ONBOARDING', 'ONBOARDING_COMPLETED', activeUser.accountId, `Verified National ID ${payload.nationalId} & activated ${formatPHP(payload.activatedLimit)} limit`, impersonatorAdmin?.handle),
        ...prev.auditLogs,
      ],
    }));

    setShareholderTab('home');
    showToast(`Onboarding completed! ${formatPHP(payload.activatedLimit)} credit line activated`);
  }, [activeUser, impersonatorAdmin, showToast, createNotification, createAuditEntry]);

  const handleLogout = useCallback(async () => {
    if (!activeUser) return;
    setNotificationsOpen(false);
    
    await logoutMutation.mutate();
    
    setState(prev => ({
      ...prev,
      activeUserId: null,
      impersonatorAdminId: null,
      auditLogs: [
        createAuditEntry(activeUser, 'AUTH', 'USER_LOGOUT', activeUser.accountId, `Signed out of ${getRoleLabel(activeUser.role)} session`, impersonatorAdmin?.handle),
        ...prev.auditLogs,
      ],
    }));
    showToast('Signed out cleanly');
  }, [activeUser, impersonatorAdmin, logoutMutation, showToast, createAuditEntry]);

  const legacyHandleRegisterNewMember = (payload: {
    fullName: string;
    handle: string;
    phone: string;
    email: string;
  }) => {
    const newId = `user-shareholder-${Date.now()}`;
    const acctId = `SH-${Math.floor(1000 + Math.random() * 9000)}-2026`;
    const newUser = {
      id: newId,
      role: UserRole.SHAREHOLDER,
      status: 'ACTIVE' as const,
      fullName: payload.fullName,
      handle: payload.handle,
      phone: payload.phone,
      email: payload.email,
      password: 'password123',
      accountId: acctId,
      avatarPath: '',
      kycVerified: false,
      onboardingCompleted: false,
      statementDay: 15 as const,
      securityPin: '123456',
      autoDebitEnabled: false,
      totalLimit: 0,
      shareCapital: 12000,
      nationalId: '',
      cityAddress: '',
      incomeSource: 'Salaried · Digital Operations',
      monthlyIncome: 45000,
      channels: [],
      boostTasks: [
        {
          id: 'boost-kyc',
          title: 'Complete 3-Step KYC & National ID Onboarding',
          subtitle: 'Activates initial pre-qualified revolving credit ceiling',
          boostAmount: 0,
          completed: false,
          actionLabel: 'Pending Onboarding',
        },
        {
          id: 'boost-income',
          title: 'Upload Latest Monthly Payslip or Bank Statement',
          subtitle: 'Verify monthly income to boost cash credit ceiling',
          boostAmount: 10000,
          completed: false,
          actionLabel: 'Verify +₱10,000',
        },
        {
          id: 'boost-autodebit',
          title: 'Enable Auto-Debit on Primary Payout Account',
          subtitle: 'Automatic statement day settlement with ₱0 fee',
          boostAmount: 5000,
          completed: false,
          actionLabel: 'Enable +₱5,000',
        },
      ],
    };

    setNotificationsOpen(false);

    setState((prev) => ({
      ...prev,
      activeUserId: newId,
      impersonatorAdminId: null,
      users: [newUser, ...prev.users],
      notifications: [
        createNotification(
          newId,
          'ACCOUNT',
          'Welcome to TikCredit',
          'Complete your 3-step KYC onboarding to activate your revolving cash credit line.',
          acctId
        ),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(
          newUser,
          'ONBOARDING',
          'SHAREHOLDER_REGISTERED',
          acctId,
          `Created new Shareholder account ${payload.handle} with zero loan history`
        ),
        ...prev.auditLogs,
      ],
    }));

    setShareholderTab('home');
    showToast('Account created — complete 3-step Member Onboarding');
  };

  const legacyHandleCompleteOnboarding = (payload: {
    cityAddress: string;
    incomeSource: string;
    monthlyIncome: number;
    shareCapital: number;
    nationalId: string;
    payoutProvider: LinkedChannel['provider'];
    payoutAccountDigits: string;
    securityPin: string;
    activatedLimit: number;
  }) => {
    if (!activeUser) return;

    const targetMask = `•••• ${payload.payoutAccountDigits}`;
    const primaryChannel: LinkedChannel = {
      id: `ch-onb-${Date.now()}`,
      provider: payload.payoutProvider,
      accountMask: targetMask,
      accountHolder: activeUser.fullName,
      instantDisbursement: true,
      isDefault: true,
    };

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id !== activeUser.id) return u;
        const remainingChannels = u.channels
          .filter(
            (c) =>
              !(c.provider === payload.payoutProvider && c.accountMask === targetMask)
          )
          .map((c) => ({ ...c, isDefault: false }));

        return {
          ...u,
          onboardingCompleted: true,
          kycVerified: true,
          cityAddress: payload.cityAddress,
          incomeSource: payload.incomeSource,
          monthlyIncome: payload.monthlyIncome,
          shareCapital: payload.shareCapital,
          nationalId: payload.nationalId,
          securityPin: payload.securityPin,
          totalLimit: payload.activatedLimit,
          channels: [primaryChannel, ...remainingChannels],
          boostTasks: u.boostTasks.map((t) =>
            t.id === 'boost-kyc'
              ? { ...t, completed: true, actionLabel: 'Completed' }
              : t
          ),
        };
      }),
      notifications: [
        createNotification(
          activeUser.id,
          'ACCOUNT',
          'Revolving Credit Line Activated',
          `Your ${formatPHP(payload.activatedLimit)} cash loan limit is active with instant payout to ${payload.payoutProvider} •••• ${payload.payoutAccountDigits}.`,
          activeUser.accountId
        ),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(
          activeUser,
          'ONBOARDING',
          'ONBOARDING_COMPLETED',
          activeUser.accountId,
          `Verified National ID ${payload.nationalId} & activated ${formatPHP(
            payload.activatedLimit
          )} limit`,
          impersonatorAdmin?.handle
        ),
        ...prev.auditLogs,
      ],
    }));

    setShareholderTab('home');
    showToast(
      `Onboarding completed! ${formatPHP(payload.activatedLimit)} credit line activated`
    );
  };

  const legacyHandleLogout = () => {
    if (!activeUser) return;
    setNotificationsOpen(false);
    setState((prev) => ({
      ...prev,
      activeUserId: null,
      impersonatorAdminId: null,
      auditLogs: [
        createAuditEntry(
          activeUser,
          'AUTH',
          'USER_LOGOUT',
          activeUser.accountId,
          `Signed out of ${getRoleLabel(activeUser.role)} session`,
          impersonatorAdmin?.handle
        ),
        ...prev.auditLogs,
      ],
    }));
    showToast('Signed out cleanly');
  };

  /* ADMIN IMPERSONATION HANDLERS */
  const handleStartImpersonation = (targetUserId: string) => {
    if (!activeUser || activeUser.role !== UserRole.ADMIN) return;
    const target = state.users.find((u) => u.id === targetUserId);
    if (!target) return;

    setNotificationsOpen(false);

    setState((prev) => ({
      ...prev,
      impersonatorAdminId: activeUser.id,
      activeUserId: target.id,
      auditLogs: [
        createAuditEntry(
          activeUser,
          'IMPERSONATION',
          'IMPERSONATION_STARTED',
          target.accountId,
          `Admin ${activeUser.handle} started impersonating ${target.fullName} (${getRoleLabel(
            target.role
          )})`
        ),
        ...prev.auditLogs,
      ],
    }));

    if (target.role === UserRole.SHAREHOLDER) setShareholderTab('home');
    if (target.role === UserRole.MANAGER) setManagerTab('overview');
    if (target.role === UserRole.ADMIN) setAdminTab('users');
    if (target.role === UserRole.CASHIER) setIsPosOpen(true);

    showToast(`Now impersonating ${target.fullName} (${target.handle})`);
  };

  const handleExitImpersonation = () => {
    if (!impersonatorAdmin || !activeUser) return;
    setNotificationsOpen(false);
    setState((prev) => ({
      ...prev,
      activeUserId: impersonatorAdmin.id,
      impersonatorAdminId: null,
      auditLogs: [
        createAuditEntry(
          impersonatorAdmin,
          'IMPERSONATION',
          'IMPERSONATION_ENDED',
          activeUser.accountId,
          `Returned from ${activeUser.handle} session back to Admin console`
        ),
        ...prev.auditLogs,
      ],
    }));
    setAdminTab('users');
    showToast(`Exited impersonation · Returned to ${impersonatorAdmin.handle}`);
  };

  /* SHAREHOLDER CASH LOAN REQUEST SUBMISSION */
  const handleRequestCashLoan = (
    amount: number,
    tenor: TenorMonths,
    channelId: string,
    purpose: string
  ) => {
    if (!activeUser) return;
    const channel =
      activeUser.channels.find((c) => c.id === channelId) ||
      activeUser.channels[0];
    const channelLabel = channel
      ? `${channel.provider} ${channel.accountMask}`
      : 'GCash •••• 4821';

    setPendingPinAction({
      summary: `Submit Loan Request (${tenor} ${
        tenor === 1 ? 'mo' : 'mos'
      }) · ${purpose}`,
      amountLabel: formatPHP(amount),
      execute: () => {
        const quote = calculateLoanQuote(
          amount,
          tenor,
          PlanType.CASH_LOAN,
          activeUser.statementDay
        );
        const refCode = `LRQ-202611-${Math.floor(500 + Math.random() * 499)}`;

        const newReq: LoanRequestItem = {
          id: `req-${Date.now()}`,
          referenceCode: refCode,
          userId: activeUser.id,
          applicantName: activeUser.fullName,
          applicantHandle: activeUser.handle,
          nationalId: activeUser.nationalId,
          applicantProfile: `${activeUser.incomeSource} · ${formatPHP(
            activeUser.monthlyIncome
          )}/mo · ${activeUser.cityAddress}`,
          shareCapitalSnapshot: activeUser.shareCapital,
          type: PlanType.CASH_LOAN,
          purpose,
          principal: amount,
          tenor,
          monthlyRatePct: quote.monthlyRatePct,
          monthlyInstallment: quote.monthlyInstallment,
          totalRepayment: quote.totalRepayment,
          disbursementChannel: channelLabel,
          status: LoanRequestStatus.PENDING,
          createdAt: formatNowTimestamp(),
          checklist: {
            kycVerified: activeUser.kycVerified,
            shareCapitalChecked: activeUser.shareCapital >= 10000,
            repaymentCapacityChecked: false,
          },
        };

        setState((prev) => {
          const staffIds = prev.users
            .filter(
              (u) => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN
            )
            .map((u) => u.id);

          const generatedNotifications: NotificationItem[] = [
            createNotification(
              activeUser.id,
              'LOAN',
              'Loan Request Submitted',
              `${formatPHP(amount)} (${tenor}m) for ${purpose} is pending Loan Manager verification.`,
              refCode
            ),
            ...staffIds.map((staffId) =>
              createNotification(
                staffId,
                'APPROVAL',
                'New Loan Request Awaiting Verification',
                `${activeUser.fullName} (${activeUser.handle}) requested ${formatPHP(
                  amount
                )} (${tenor}m) for ${purpose}.`,
                refCode
              )
            ),
          ];

          return {
            ...prev,
            loanRequests: [newReq, ...prev.loanRequests],
            notifications: [...generatedNotifications, ...prev.notifications],
            auditLogs: [
              createAuditEntry(
                activeUser,
                'LOAN',
                'LOAN_REQUEST_SUBMITTED',
                refCode,
                `Submitted ${formatPHP(amount)} (${tenor}m) loan request for ${purpose}`,
                impersonatorAdmin?.handle
              ),
              ...prev.auditLogs,
            ],
          };
        });

        setPendingPinAction(null);
        setShareholderTab('home');
        showToast(`Loan Request ${refCode} submitted for Manager approval`);
      },
    });
  };

  /* MANAGER & ADMIN LOAN VERIFICATION & DISBURSEMENT */
  const handleToggleLoanChecklist = (
    requestId: string,
    field: 'kycVerified' | 'shareCapitalChecked' | 'repaymentCapacityChecked'
  ) => {
    setState((prev) => ({
      ...prev,
      loanRequests: prev.loanRequests.map((r) => {
        if (r.id !== requestId) return r;
        const curr = r.checklist || {
          kycVerified: false,
          shareCapitalChecked: false,
          repaymentCapacityChecked: false,
        };
        return {
          ...r,
          checklist: { ...curr, [field]: !curr[field] },
        };
      }),
    }));
  };

  const handleDecideLoanRequest = (
    requestId: string,
    decision: LoanRequestStatus.APPROVED | LoanRequestStatus.REJECTED,
    reviewNote: string
  ) => {
    if (!activeUser) return;
    const req = state.loanRequests.find((r) => r.id === requestId);
    if (!req || req.status !== LoanRequestStatus.PENDING) return;

    const borrower = state.users.find((u) => u.id === req.userId);
    const statementDay = borrower?.statementDay || 15;
    const reviewerLabel = `${activeUser.fullName} (${activeUser.handle})`;
    const nowStr = formatNowTimestamp();

    if (decision === LoanRequestStatus.APPROVED) {
      const quote = calculateLoanQuote(
        req.principal,
        req.tenor,
        req.type,
        statementDay
      );

      const planId = `plan-${Date.now()}`;
      const contractRef = `TCL-${Math.floor(100000 + Math.random() * 900000)}`;

      const installments: InstallmentItem[] = quote.scheduleDates.map(
        (dueDate, idx) => ({
          id: `${planId}-inst-${idx + 1}`,
          userId: req.userId,
          planId,
          planTitle: req.purpose,
          planType: req.type,
          sequence: idx + 1,
          totalSequence: req.tenor,
          dueDate,
          principalPart: quote.monthlyPrincipal,
          interestPart: quote.monthlyInterest,
          totalDue: quote.monthlyInstallment,
          status: InstallmentStatus.UPCOMING,
        })
      );

      const newPlan: CreditPlan = {
        id: planId,
        userId: req.userId,
        referenceCode: contractRef,
        title: req.purpose,
        type: req.type,
        createdAt: 'Nov 2, 2026',
        principal: req.principal,
        monthlyRatePct: req.monthlyRatePct,
        tenor: req.tenor,
        disbursedToOrMerchant: req.disbursementChannel,
        installments,
      };

      const newLedger: LedgerEntry = {
        id: `led-${Date.now()}`,
        userId: req.userId,
        referenceCode: contractRef,
        title: 'Cash Loan Approved & Disbursed',
        subtitle: `${req.purpose} · ${req.disbursementChannel}`,
        timestamp: nowStr,
        amount: req.principal,
        direction: 'INFLOW',
        channel: req.disbursementChannel,
        planType: req.type,
      };

      setState((prev) => ({
        ...prev,
        loanRequests: prev.loanRequests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: LoanRequestStatus.APPROVED,
                reviewedBy: reviewerLabel,
                reviewedAt: nowStr,
                reviewNote,
                checklist: {
                  kycVerified: true,
                  shareCapitalChecked: true,
                  repaymentCapacityChecked: true,
                },
              }
            : r
        ),
        plans: [newPlan, ...prev.plans],
        ledger: [newLedger, ...prev.ledger],
        notifications: [
          createNotification(
            req.userId,
            'LOAN',
            'Cash Loan Approved & Disbursed',
            `${formatPHP(req.principal)} for ${req.purpose} was disbursed to ${req.disbursementChannel}. Contract ID: ${contractRef}.`,
            contractRef
          ),
          ...prev.notifications,
        ],
        auditLogs: [
          createAuditEntry(
            activeUser,
            'LOAN',
            'LOAN_APPROVED',
            req.referenceCode,
            `Approved & disbursed ${formatPHP(req.principal)} to ${
              req.applicantName
            } via ${req.disbursementChannel}`,
            impersonatorAdmin?.handle
          ),
          ...prev.auditLogs,
        ],
      }));

      showToast(
        `Approved ${req.referenceCode} · ${formatPHP(req.principal)} disbursed to ${
          req.applicantHandle
        }`
      );
    } else {
      setState((prev) => ({
        ...prev,
        loanRequests: prev.loanRequests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: LoanRequestStatus.REJECTED,
                reviewedBy: reviewerLabel,
                reviewedAt: nowStr,
                reviewNote,
              }
            : r
        ),
        notifications: [
          createNotification(
            req.userId,
            'LOAN',
            'Loan Application Declined',
            `Request ${req.referenceCode} (${formatPHP(req.principal)}) was not approved: ${reviewNote}`,
            req.referenceCode
          ),
          ...prev.notifications,
        ],
        auditLogs: [
          createAuditEntry(
            activeUser,
            'LOAN',
            'LOAN_DECLINED',
            req.referenceCode,
            `Declined ${req.referenceCode} (${req.applicantName}): ${reviewNote}`,
            impersonatorAdmin?.handle
          ),
          ...prev.auditLogs,
        ],
      }));

      showToast(`Declined loan request ${req.referenceCode}`);
    }
  };

  const handleReopenLoanRequest = (requestId: string) => {
    if (!activeUser) return;
    const req = state.loanRequests.find((r) => r.id === requestId);
    if (!req) return;

    setState((prev) => ({
      ...prev,
      loanRequests: prev.loanRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: LoanRequestStatus.PENDING,
              reviewNote: 'Reopened to Pending Verification by Administrator.',
            }
          : r
      ),
      notifications: [
        createNotification(
          req.userId,
          'LOAN',
          'Loan Application Reopened',
          `Your loan request ${req.referenceCode} was reopened to Pending Verification by System Admin.`,
          req.referenceCode
        ),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(
          activeUser,
          'LOAN',
          'LOAN_REOPENED',
          req.referenceCode,
          `Reopened ${req.referenceCode} for underwriting review`
        ),
        ...prev.auditLogs,
      ],
    }));

    showToast(`Reopened ${req.referenceCode} to Pending`);
  };

  /* REPAYMENTS */
  const handleConfirmInstallmentPayment = (
    installmentId: string,
    channelLabel: string
  ) => {
    if (!activeUser) return;
    const target = repayInstallment;
    if (!target || target.id !== installmentId) return;

    const refCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = formatNowTimestamp();

    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => ({
        ...p,
        installments: p.installments.map((inst) =>
          inst.id === installmentId
            ? {
                ...inst,
                status: InstallmentStatus.PAID,
                paidAt: 'Nov 2, 2026',
                paidVia: channelLabel,
              }
            : inst
        ),
      })),
      ledger: [
        {
          id: `led-${Date.now()}`,
          userId: target.userId,
          referenceCode: refCode,
          title: `Installment ${target.sequence}/${target.totalSequence} Repayment`,
          subtitle: target.planTitle,
          timestamp: nowStr,
          amount: target.totalDue,
          direction: 'REPAYMENT',
          channel: channelLabel,
          planType: target.planType,
        },
        ...prev.ledger,
      ],
      notifications: [
        createNotification(
          target.userId,
          'PAYMENT',
          'Installment Payment Confirmed',
          `Paid ${formatPHP(target.totalDue)} via ${channelLabel} for ${target.planTitle}. +${formatPHP(
            target.principalPart
          )} credit restored.`,
          refCode
        ),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(
          activeUser,
          'PAYMENT',
          'INSTALLMENT_PAID',
          refCode,
          `Paid ${formatPHP(target.totalDue)} via ${channelLabel} for ${
            target.planTitle
          }`,
          impersonatorAdmin?.handle
        ),
        ...prev.auditLogs,
      ],
    }));

    setRepayInstallment(null);
    showToast(
      `Paid ${formatPHP(target.totalDue)} · +${formatPHP(
        target.principalPart
      )} credit restored`
    );
  };

  const handleEarlySettlePlan = (plan: CreditPlan) => {
    if (!activeUser) return;
    const unpaid = plan.installments.filter(
      (i) => i.status === InstallmentStatus.UPCOMING
    );
    if (unpaid.length === 0) return;

    const remainingPrincipal = Number(
      unpaid.reduce((acc, i) => acc + i.principalPart, 0).toFixed(2)
    );
    const defaultCh =
      activeUser.channels.find((c) => c.isDefault) || activeUser.channels[0];
    const channelLabel = defaultCh
      ? `${defaultCh.provider} ${defaultCh.accountMask}`
      : 'GCash •••• 4821';
    const refCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = formatNowTimestamp();

    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) =>
        p.id === plan.id
          ? {
              ...p,
              installments: p.installments.map((inst) =>
                inst.status === InstallmentStatus.UPCOMING
                  ? {
                      ...inst,
                      interestPart: 0,
                      totalDue: inst.principalPart,
                      status: InstallmentStatus.PAID,
                      paidAt: 'Nov 2, 2026',
                      paidVia: channelLabel,
                    }
                  : inst
              ),
            }
          : p
      ),
      ledger: [
        {
          id: `led-${Date.now()}`,
          userId: plan.userId,
          referenceCode: refCode,
          title: 'Early Full Principal Payoff',
          subtitle: `${plan.title} · Future Interest Waived`,
          timestamp: nowStr,
          amount: remainingPrincipal,
          direction: 'REPAYMENT',
          channel: channelLabel,
          planType: plan.type,
        },
        ...prev.ledger,
      ],
      notifications: [
        createNotification(
          plan.userId,
          'PAYMENT',
          'Early Full Principal Payoff Confirmed',
          `Settled remaining principal ${formatPHP(
            remainingPrincipal
          )} on ${plan.title} with future interest waived.`,
          refCode
        ),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(
          activeUser,
          'PAYMENT',
          'EARLY_FULL_PAYOFF',
          refCode,
          `Settled remaining principal ${formatPHP(remainingPrincipal)} on ${
            plan.title
          }`,
          impersonatorAdmin?.handle
        ),
        ...prev.auditLogs,
      ],
    }));

    showToast(
      `Early payoff complete · +${formatPHP(remainingPrincipal)} restored`
    );
  };

  /* SUPPORT TICKETS & FEEDBACK */
  const handleSubmitTicketOrFeedback = (payload: {
    kind: 'TICKET' | 'FEEDBACK';
    category: SupportTicketItem['category'];
    priority: SupportTicketItem['priority'];
    rating?: number;
    subject: string;
    description: string;
    relatedLoanRef?: string;
  }) => {
    if (!activeUser) return;
    const prefix = payload.kind === 'FEEDBACK' ? 'FDB' : 'TKT';
    const refCode = `${prefix}-2026-${Math.floor(400 + Math.random() * 599)}`;
    const nowStr = formatNowTimestamp();

    const newTicket: SupportTicketItem = {
      id: `tkt-${Date.now()}`,
      referenceCode: refCode,
      userId: activeUser.id,
      userName: activeUser.fullName,
      userHandle: activeUser.handle,
      kind: payload.kind,
      category: payload.category,
      priority: payload.priority,
      rating: payload.rating,
      subject: payload.subject,
      description: payload.description,
      relatedLoanRef: payload.relatedLoanRef,
      status: TicketStatus.OPEN,
      createdAt: nowStr,
      updatedAt: nowStr,
      replies: [],
    };

    setState((prev) => {
      const staffIds = prev.users
        .filter((u) => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN)
        .map((u) => u.id);

      const generatedNotifications: NotificationItem[] = [
        createNotification(
          activeUser.id,
          'TICKET',
          payload.kind === 'FEEDBACK'
            ? 'Feedback Recorded'
            : 'Support Ticket Opened',
          `${payload.subject} (${refCode}) has been logged with Member Support.`,
          refCode
        ),
        ...staffIds.map((staffId) =>
          createNotification(
            staffId,
            'TICKET',
            payload.kind === 'FEEDBACK'
              ? 'New Member Feedback'
              : 'New Support Ticket',
            `${activeUser.fullName} (${activeUser.handle}) submitted ${refCode}: ${payload.subject}`,
            refCode
          )
        ),
      ];

      return {
        ...prev,
        tickets: [newTicket, ...prev.tickets],
        notifications: [...generatedNotifications, ...prev.notifications],
        auditLogs: [
          createAuditEntry(
            activeUser,
            'TICKET',
            payload.kind === 'FEEDBACK'
              ? 'FEEDBACK_SUBMITTED'
              : 'TICKET_OPENED',
            refCode,
            `${payload.subject}`,
            impersonatorAdmin?.handle
          ),
          ...prev.auditLogs,
        ],
      };
    });

    showToast(
      payload.kind === 'FEEDBACK'
        ? `Thank you! Feedback ${refCode} recorded`
        : `Support Ticket ${refCode} submitted`
    );
  };

  const handleReplyTicket = (ticketId: string, message: string) => {
    if (!activeUser) return;
    const target = state.tickets.find((t) => t.id === ticketId);
    if (!target) return;
    const nowStr = formatNowTimestamp();

    const nextStatus =
      activeUser.role !== UserRole.SHAREHOLDER &&
      target.status === TicketStatus.OPEN
        ? TicketStatus.IN_REVIEW
        : target.status;

    setState((prev) => {
      const recipientNotifications: NotificationItem[] =
        activeUser.role !== UserRole.SHAREHOLDER
          ? [
              createNotification(
                target.userId,
                'TICKET',
                'Support Reply Received',
                `${activeUser.fullName} (${getRoleLabel(
                  activeUser.role
                )}) replied on ${target.referenceCode}: "${message}"`,
                target.referenceCode
              ),
            ]
          : prev.users
              .filter(
                (u) => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN
              )
              .map((staff) =>
                createNotification(
                  staff.id,
                  'TICKET',
                  'Member Follow-Up on Ticket',
                  `${activeUser.fullName} (${activeUser.handle}) replied on ${target.referenceCode}.`,
                  target.referenceCode
                )
              );

      return {
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: nextStatus,
                updatedAt: nowStr,
                replies: [
                  ...t.replies,
                  {
                    id: `rep-${Date.now()}`,
                    authorName: activeUser.fullName,
                    authorRole: activeUser.role,
                    message,
                    timestamp: nowStr,
                  },
                ],
              }
            : t
        ),
        notifications: [...recipientNotifications, ...prev.notifications],
        auditLogs: [
          createAuditEntry(
            activeUser,
            'TICKET',
            'TICKET_REPLIED',
            target.referenceCode,
            `Posted reply on ${target.referenceCode}`,
            impersonatorAdmin?.handle
          ),
          ...prev.auditLogs,
        ],
      };
    });

    showToast(`Reply posted to ${target.referenceCode}`);
  };

  const handleUpdateTicketStatus = (ticketId: string, status: TicketStatus) => {
    if (!activeUser) return;
    const target = state.tickets.find((t) => t.id === ticketId);
    if (!target) return;

    setState((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, status, updatedAt: formatNowTimestamp() }
          : t
      ),
      notifications: [
        createNotification(
          target.userId,
          'TICKET',
          'Ticket Status Updated',
          `Ticket ${target.referenceCode} (${target.subject}) was marked ${status}.`,
          target.referenceCode
        ),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(
          activeUser,
          'TICKET',
          `TICKET_${status}`,
          target.referenceCode,
          `Updated ${target.referenceCode} status to ${status}`,
          impersonatorAdmin?.handle
        ),
        ...prev.auditLogs,
      ],
    }));

    showToast(`${target.referenceCode} marked ${status}`);
  };

  /* ADMIN USER MANAGEMENT & BACKUPS */
  const handleAdminCreateUser = (payload: {
    fullName: string;
    handle: string;
    email: string;
    phone: string;
    role: UserRole;
    totalLimit: number;
    shareCapital: number;
  }) => {
    if (!activeUser) return;
    const prefix =
      payload.role === UserRole.SHAREHOLDER
        ? 'SH'
        : payload.role === UserRole.MANAGER
        ? 'MGR'
        : payload.role === UserRole.CASHIER
        ? 'CSH'
        : 'ADM';
    const acctId = `${prefix}-${Math.floor(1000 + Math.random() * 8999)}`;
    const newUserId = `user-${Date.now()}`;

    const created = {
      id: newUserId,
      role: payload.role,
      status: 'ACTIVE' as const,
      fullName: payload.fullName,
      handle: payload.handle,
      phone: payload.phone,
      email: payload.email,
      password: 'password123',
      accountId: acctId,
      avatarPath: '',
      kycVerified: true,
      onboardingCompleted: true,
      statementDay: 15 as const,
      securityPin: '123456',
      autoDebitEnabled: false,
      totalLimit: payload.totalLimit,
      shareCapital: payload.shareCapital,
      nationalId:
        payload.role === UserRole.SHAREHOLDER
          ? `PHN-4821-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(
              1000 + Math.random() * 8999
            )}`
          : 'N/A',
      cityAddress:
        payload.role === UserRole.SHAREHOLDER
          ? 'Makati City, Metro Manila'
          : payload.role === UserRole.CASHIER
          ? 'Agri-Trading Store POS Counter'
          : 'Metro Manila Operations Hub',
      incomeSource:
        payload.role === UserRole.SHAREHOLDER
          ? 'Salaried Professional'
          : payload.role === UserRole.CASHIER
          ? 'Store Counter Operations'
          : 'Platform Operations',
      monthlyIncome:
        payload.role === UserRole.SHAREHOLDER
          ? 48000
          : payload.role === UserRole.CASHIER
          ? 24000
          : 0,
      departmentOrBranch:
        payload.role === UserRole.CASHIER
          ? 'Main Cooperative Store · Terminal 01'
          : payload.role !== UserRole.SHAREHOLDER
          ? 'Metro Manila Operations Hub'
          : undefined,
      channels:
        payload.role === UserRole.SHAREHOLDER
          ? [
              {
                id: `ch-${Date.now()}`,
                provider: 'GCash' as const,
                accountMask: `•••• ${
                  payload.phone.replace(/\D/g, '').slice(-4) || '4421'
                }`,
                accountHolder: payload.fullName,
                instantDisbursement: true,
                isDefault: true,
              },
            ]
          : [],
      boostTasks:
        payload.role === UserRole.SHAREHOLDER
          ? [
              {
                id: 'boost-kyc',
                title: 'Complete KYC & National ID Verification',
                subtitle: 'Provisioned & verified by System Admin',
                boostAmount: 0,
                completed: true,
                actionLabel: 'Completed',
              },
              {
                id: 'boost-income',
                title: 'Upload Latest Monthly Payslip or Bank Statement',
                subtitle: 'Verify monthly income to boost cash credit ceiling',
                boostAmount: 10000,
                completed: false,
                actionLabel: 'Verify +₱10,000',
              },
              {
                id: 'boost-autodebit',
                title: 'Enable Auto-Debit on Primary Payout Account',
                subtitle: 'Automatic statement day settlement with ₱0 fee',
                boostAmount: 5000,
                completed: false,
                actionLabel: 'Enable +₱5,000',
              },
            ]
          : [],
    };

    setState((prev) => ({
      ...prev,
      users: [created, ...prev.users],
      notifications: [
        createNotification(
          newUserId,
          'ACCOUNT',
          'Account Provisioned',
          `Your ${getRoleLabel(payload.role)} account (${acctId}) was provisioned by System Admin.`,
          acctId
        ),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(
          activeUser,
          'USER_MGMT',
          'USER_CREATED',
          acctId,
          `Provisioned ${getRoleLabel(payload.role)} account ${payload.handle}`
        ),
        ...prev.auditLogs,
      ],
    }));

    showToast(`Created ${payload.fullName} (${getRoleLabel(payload.role)})`);
  };

  const handleAdminUpdateUser = (
    userId: string,
    updates: {
      role: UserRole;
      status: 'ACTIVE' | 'SUSPENDED';
      totalLimit: number;
      shareCapital: number;
      kycVerified: boolean;
    }
  ) => {
    if (!activeUser) return;
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId ? { ...u, ...updates } : u
      ),
      notifications: [
        createNotification(
          userId,
          'ACCOUNT',
          'Account Standing Updated',
          `Your account standing was updated by System Admin (Status: ${updates.status}, Credit Limit: ${formatPHP(
            updates.totalLimit
          )}).`,
          target.accountId
        ),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(
          activeUser,
          'USER_MGMT',
          'USER_UPDATED',
          target.accountId,
          `Updated ${target.handle} (${getRoleLabel(updates.role)}, ${
            updates.status
          }, Limit ${formatPHP(updates.totalLimit)})`
        ),
        ...prev.auditLogs,
      ],
    }));

    showToast(`Updated ${target.fullName}`);
  };

  const handleAdminResetPin = (userId: string) => {
    if (!activeUser) return;
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId ? { ...u, securityPin: '123456' } : u
      ),
      notifications: [
        createNotification(
          userId,
          'ACCOUNT',
          'Security PIN Reset',
          'Your 6-digit TikCredit Security PIN was reset to default (123456) by System Admin.',
          target.accountId
        ),
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(
          activeUser,
          'USER_MGMT',
          'USER_PIN_RESET',
          target.accountId,
          `Reset 6-digit security PIN for ${target.handle} to default 123456`
        ),
        ...prev.auditLogs,
      ],
    }));

    showToast(`Reset PIN for ${target.handle} to 123456`);
  };

  const handleCreateBackupSnapshot = (label: string) => {
    if (!activeUser) return;
    const totalVol = state.loanRequests.reduce((s, r) => s + r.principal, 0);
    const snapshotPayload = { ...state, backups: [] };
    const snap: BackupSnapshot = {
      id: `bkp-${Date.now()}`,
      label,
      createdAt: formatNowTimestamp(),
      createdBy: `${activeUser.fullName} (${activeUser.handle})`,
      usersCount: state.users.length,
      loansCount: state.loanRequests.length,
      ticketsCount: state.tickets.length,
      totalVolumePHP: totalVol,
      checksum: `SHA256-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
      serializedData: JSON.stringify(snapshotPayload),
    };

    setState((prev) => ({
      ...prev,
      backups: [snap, ...prev.backups],
      auditLogs: [
        createAuditEntry(
          activeUser,
          'BACKUP',
          'SNAPSHOT_CREATED',
          snap.checksum,
          `Created backup snapshot "${label}" (${prev.users.length} users)`
        ),
        ...prev.auditLogs,
      ],
    }));

    showToast(`Snapshot "${label}" saved`);
  };

  const handleRestoreBackupSnapshot = (snapshot: BackupSnapshot) => {
    if (!activeUser) return;
    try {
      const parsed = JSON.parse(snapshot.serializedData) as PlatformState;
      setState((prev) => ({
        ...parsed,
        notifications: Array.isArray(parsed.notifications)
          ? parsed.notifications
          : [],
        activeUserId: activeUser.id,
        impersonatorAdminId: null,
        backups: prev.backups,
        auditLogs: [
          createAuditEntry(
            activeUser,
            'BACKUP',
            'SNAPSHOT_RESTORED',
            snapshot.checksum,
            `Restored platform state from "${snapshot.label}"`
          ),
          ...(parsed.auditLogs || []),
        ],
      }));
      showToast(`Restored state from "${snapshot.label}"`);
    } catch {
      showToast('Failed to parse backup snapshot');
    }
  };

  const handleImportJsonBackup = (jsonContent: string) => {
    if (!activeUser) return;
    try {
      const raw = JSON.parse(jsonContent);
      const data: PlatformState = raw.data ? raw.data : raw;
      if (!data || !Array.isArray(data.users)) {
        showToast('Invalid JSON backup schema');
        return;
      }
      setState((prev) => ({
        ...data,
        notifications: Array.isArray(data.notifications)
          ? data.notifications
          : [],
        activeUserId: activeUser.id,
        impersonatorAdminId: null,
        backups: prev.backups,
        auditLogs: [
          createAuditEntry(
            activeUser,
            'BACKUP',
            'JSON_BACKUP_IMPORTED',
            'EXTERNAL_FILE',
            `Restored ${data.users.length} users and ${data.loanRequests.length} loans from JSON file`
          ),
          ...(data.auditLogs || []),
        ],
      }));
      showToast('Imported & restored JSON backup file');
    } catch {
      showToast('Could not parse uploaded JSON file');
    }
  };

  const handleResetDemo = () => {
    const fresh = createInitialPlatformState();
    if (activeUser) {
      const stillExists = fresh.users.find((u) => u.id === activeUser.id);
      fresh.activeUserId = stillExists ? stillExists.id : fresh.users[0].id;
    }
    setNotificationsOpen(false);
    setState(fresh);
    showToast('Platform state reset to factory seed');
  };

  /* PROFILE SELF-SERVICE MUTATIONS */
  const handleCompleteBoostTask = (taskId: string) => {
    if (!activeUser) return;
    const targetTask = activeUser.boostTasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.completed) return;

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === activeUser.id
          ? {
              ...u,
              totalLimit: u.totalLimit + targetTask.boostAmount,
              autoDebitEnabled:
                taskId === 'boost-autodebit' ? true : u.autoDebitEnabled,
              boostTasks: u.boostTasks.map((t) =>
                t.id === taskId
                  ? { ...t, completed: true, actionLabel: 'Completed' }
                  : t
              ),
            }
          : u
      ),
      notifications: [
        createNotification(
          activeUser.id,
          'ACCOUNT',
          'Credit Limit Boosted',
          `Completed "${targetTask.title}" — your revolving limit increased by +${formatPHP(
            targetTask.boostAmount
          )}.`,
          activeUser.accountId
        ),
        ...prev.notifications,
      ],
    }));
    showToast(`Credit ceiling boosted by +${formatPHP(targetTask.boostAmount)}`);
  };

  /* 1. UNAUTHENTICATED -> LOGIN PORTAL */
  if (!activeUser) {
    return (
      <AuthLayout>
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-inverse text-ink-inverse px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium max-w-[92vw]"
          >
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
        <LoginView
          users={state.users}
          onLoginAsUser={handleLoginAsUser}
          onRegisterMember={handleRegisterNewMember}
        />
      </AuthLayout>
    );
  }

  /* 2. SHAREHOLDER ONBOARDING GATE */
  if (
    activeUser.role === UserRole.SHAREHOLDER &&
    !activeUser.onboardingCompleted
  ) {
    return (
      <AuthLayout>
        <OnboardingWizard
          user={activeUser}
          onCompleteOnboarding={handleCompleteOnboarding}
          onLogout={handleLogout}
        />
      </AuthLayout>
    );
  }

  /* 3. ROLE-SPECIFIC SIDEBAR NAVIGATION DEFINITIONS */
  const navigationSummary = computeUserCreditSummary(state, activeUser.id);
  const navigationUnreadCount = navigationSummary.unreadNotificationsCount;

  const shareholderNav = buildShareholderNav({
    activeTab: shareholderTab,
    billsSubTab,
    profileSubSection,
    onSelectBillsSubTab: (subTab) => {
      setNotificationsOpen(false);
      setShareholderTab('bills');
      setBillsFocus({ subTab, query: '', nonce: Date.now() });
    },
    onSelectProfileSection: (section) => {
      setNotificationsOpen(false);
      setShareholderTab('profile');
      setProfileFocus({ section, nonce: Date.now() });
    },
  });

  const managerNav = buildManagerNav({
    activeTab: managerTab,
    managerFocus,
    onSelectApprovalsFilter: (loanFilter) => {
      setNotificationsOpen(false);
      setManagerTab('approvals');
      setManagerFocus({ loanFilter, loanSearch: '', nonce: Date.now() });
    },
    onSelectTicketsFilter: (ticketFilter) => {
      setNotificationsOpen(false);
      setManagerTab('tickets');
      setManagerFocus({ ticketFilter, ticketSearch: '', nonce: Date.now() });
    },
  });

  const adminNav = buildAdminNav({
    activeTab: adminTab,
    adminFocus,
    adminSubLabel,
    onSelectLoanFilter: (loanFilter) => {
      setNotificationsOpen(false);
      setAdminTab('loans');
      setAdminFocus({ loanFilter, loanSearch: '', nonce: Date.now() });
    },
    onSelectReportsSubView: (reportsSubView) => {
      setNotificationsOpen(false);
      setAdminTab('reports');
      setAdminFocus({ reportsSubView, nonce: Date.now() });
    },
    onSelectOpsSubView: (opsSubView) => {
      setNotificationsOpen(false);
      setAdminTab('logs');
      setAdminFocus({ opsSubView, nonce: Date.now() });
    },
  });

  const posNav = buildPosNav({
    activeTab: posTab,
    isAdmin: activeUser.role === UserRole.ADMIN,
    onSelectTab: (tab) => {
      setNotificationsOpen(false);
      setPosTab(tab);
    },
  });

  const currentRoleNav =
    activeUser.role === UserRole.SHAREHOLDER
      ? shareholderNav
      : activeUser.role === UserRole.MANAGER
      ? managerNav
      : adminNav;

  const currentNavItems = isPosOpen ? posNav : currentRoleNav;

  const activeNavId = isPosOpen
    ? posTab
    : activeUser.role === UserRole.SHAREHOLDER
    ? shareholderTab
    : activeUser.role === UserRole.MANAGER
    ? managerTab
    : adminTab;

  const setRoleTab = (id: string) => {
    setNotificationsOpen(false);
    if (activeUser.role === UserRole.SHAREHOLDER) {
      setShareholderTab(id as ShareholderNavTab);
    } else if (activeUser.role === UserRole.MANAGER) {
      setManagerTab(id as ManagerNavTab);
    } else {
      setAdminTab(id as AdminNavTab);
    }
  };

  let activeSubBreadcrumb: SubBreadcrumbTarget | null = null;

  if (isPosOpen) {
    const posBreadcrumbLabels: Record<PosSubTab, string> = {
      checkout: 'POS Register & Sales',
      inventory: 'Inventory & Bulk Breakdown',
      reports: 'Sales & Financial Reports',
      backups: 'Database & Backups',
      users: 'Store Users & Cashiers',
    };
    activeSubBreadcrumb = {
      label: posBreadcrumbLabels[posTab] || 'POS Module',
      onResetParent: () => setPosTab('checkout'),
    };
  } else if (activeUser.role === UserRole.SHAREHOLDER && shareholderTab === 'bills') {
    const subLabel =
      billsSubTab === 'plans'
        ? 'Active Plans'
        : billsSubTab === 'history'
        ? 'Ledger'
        : 'Upcoming Bills';
    activeSubBreadcrumb = {
      label: subLabel,
      onResetParent: () =>
        setBillsFocus({ subTab: 'upcoming', query: '', nonce: Date.now() }),
    };
  } else if (
    activeUser.role === UserRole.SHAREHOLDER &&
    shareholderTab === 'profile'
  ) {
    activeSubBreadcrumb = {
      label:
        profileSubSection === 'tickets'
          ? 'Tickets & Feedback'
          : 'Profile & Accounts',
      onResetParent: () =>
        setProfileFocus({ section: 'account', nonce: Date.now() }),
    };
  } else if (
    activeUser.role === UserRole.ADMIN &&
    adminTab === 'reports' &&
    adminSubLabel
  ) {
    activeSubBreadcrumb = {
      label: adminSubLabel,
      onResetParent: () =>
        setAdminFocus({ reportsSubView: 'analytics', nonce: Date.now() }),
    };
  } else if (
    activeUser.role === UserRole.ADMIN &&
    adminTab === 'logs' &&
    adminSubLabel
  ) {
    activeSubBreadcrumb = {
      label: adminSubLabel,
      onResetParent: () =>
        setAdminFocus({ opsSubView: 'logs', nonce: Date.now() }),
    };
  }

  const modalsNode = (
    <>
      <PinVerificationModal
        isOpen={Boolean(pendingPinAction)}
        expectedPin={activeUser.securityPin}
        actionSummary={pendingPinAction?.summary || ''}
        amountLabel={pendingPinAction?.amountLabel || ''}
        onClose={() => setPendingPinAction(null)}
        onVerified={() => pendingPinAction?.execute()}
      />

      <RepaymentModal
        installment={repayInstallment}
        channels={activeUser.channels}
        onClose={() => setRepayInstallment(null)}
        onConfirmPayment={handleConfirmInstallmentPayment}
      />

      <ReceiptModal
        entry={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        onOpenLedger={
          activeUser.role === UserRole.SHAREHOLDER && selectedReceipt
            ? () => {
                setNotificationsOpen(false);
                setShareholderTab('bills');
                setBillsFocus({
                  subTab: 'history',
                  query: selectedReceipt.referenceCode,
                  nonce: Date.now(),
                });
              }
            : undefined
        }
      />

      <LoanRequestDetailModal
        request={selectedLoanRequest}
        onClose={() => setSelectedLoanRequest(null)}
        onOpenActivePlans={
          activeUser.role === UserRole.SHAREHOLDER
            ? () => {
                setNotificationsOpen(false);
                setShareholderTab('bills');
                setBillsFocus({
                  subTab: 'plans',
                  query: '',
                  nonce: Date.now(),
                });
              }
            : undefined
        }
        onOpenSupportTickets={
          activeUser.role === UserRole.SHAREHOLDER
            ? () => {
                setNotificationsOpen(false);
                setShareholderTab('profile');
                setProfileFocus({
                  section: 'tickets',
                  nonce: Date.now(),
                });
              }
            : undefined
        }
      />

      <AddChannelModal
        isOpen={addChannelOpen}
        defaultHolder={activeUser.fullName}
        onClose={() => setAddChannelOpen(false)}
        onAdd={(provider, last4, holder) => {
          const newCh: LinkedChannel = {
            id: `ch-${Date.now()}`,
            provider,
            accountMask: `•••• ${last4}`,
            accountHolder: holder,
            instantDisbursement: true,
            isDefault: false,
          };
          setState((prev) => ({
            ...prev,
            users: prev.users.map((u) =>
              u.id === activeUser.id
                ? { ...u, channels: [...u.channels, newCh] }
                : u
            ),
          }));
          showToast(`Linked ${provider} •••• ${last4}`);
        }}
      />

      <ChangePinModal
        isOpen={changePinOpen}
        currentPin={activeUser.securityPin}
        onClose={() => setChangePinOpen(false)}
        onSavePin={(newPin) => {
          setState((prev) => ({
            ...prev,
            users: prev.users.map((u) =>
              u.id === activeUser.id ? { ...u, securityPin: newPin } : u
            ),
          }));
          showToast('6-digit Security PIN updated');
        }}
      />

      <EditProfileModal
        isOpen={editProfileOpen}
        user={activeUser}
        onClose={() => setEditProfileOpen(false)}
        onSaveProfile={(updated) => {
          setState((prev) => ({
            ...prev,
            users: prev.users.map((u) =>
              u.id === activeUser.id ? { ...u, ...updated } : u
            ),
          }));
          showToast('Profile details saved');
        }}
      />
    </>
  );

  const notificationDropdownNode = (
    <NotificationDropdown
      user={activeUser}
      notifications={activeSummary.userNotifications}
      loanRequests={
        activeUser.role === UserRole.SHAREHOLDER
          ? activeSummary.userLoanRequests
          : state.loanRequests
      }
      ledger={
        activeUser.role === UserRole.SHAREHOLDER
          ? activeSummary.userLedger
          : state.ledger
      }
      balanceMasked={balanceMasked}
      onSelectNotification={handleSelectNotification}
      onSelectLoanRequest={handleSelectLoanRequest}
      onSelectLedgerEntry={handleSelectLedgerEntry}
      onMarkAllRead={handleMarkAllNotificationsRead}
    />
  );

  return (
    <AppLayout
      activeUser={activeUser}
      impersonatorAdmin={impersonatorAdmin ?? undefined}
      navItems={currentNavItems}
      activeNavId={activeNavId}
      notificationsOpen={notificationsOpen}
      unreadCount={unreadCount}
      notificationMenu={notificationDropdownNode}
      activeSubBreadcrumb={activeSubBreadcrumb}
      toastMessage={toastMessage}
      isPosOpen={isPosOpen}
      onTogglePos={() => setIsPosOpen((open) => !open)}
      onSelectNav={(id) => {
        if (isPosOpen) {
          setPosTab(id as PosSubTab);
        } else {
          setRoleTab(id);
        }
      }}
      onToggleNotifications={() => setNotificationsOpen((open) => !open)}
      onCloseNotifications={() => setNotificationsOpen(false)}
      onExitImpersonation={handleExitImpersonation}
      modals={modalsNode}
    >
      {isPosOpen ? (
        <PosWorkspace
          initialRole={
            activeUser.role === UserRole.SHAREHOLDER
              ? 'SHAREHOLDER'
              : activeUser.role === UserRole.ADMIN
              ? 'ADMIN'
              : 'CASHIER'
          }
          currentUserName={activeUser.fullName}
          activeTab={posTab}
          onSelectTab={setPosTab}
          platformState={state}
          currentAdminId={activeUser.id}
          onImpersonateUser={handleStartImpersonation}
          onCreateUser={handleAdminCreateUser}
          onUpdateUserAdmin={handleAdminUpdateUser}
          onResetUserPin={handleAdminResetPin}
          onExitPos={() => setIsPosOpen(false)}
        />
      ) : (
        <>
          {/* SHAREHOLDER ROLE WORKSPACE */}
          {activeUser.role === UserRole.SHAREHOLDER && (
        <ShareholderWorkspace
          activeTab={shareholderTab}
          state={state}
          user={activeUser}
          balanceMasked={balanceMasked}
          billsFocus={billsFocus}
          profileFocus={profileFocus}
          onToggleMask={() => setBalanceMasked((m) => !m)}
          onSelectTab={(tab) => setShareholderTab(tab)}
          onBillsSubTabChange={setBillsSubTab}
          onProfileSectionChange={setProfileSubSection}
          onRequestCashLoan={handleRequestCashLoan}
          onInspectLoanRequest={(req) => setSelectedLoanRequest(req)}
          onOpenPayInstallment={(inst) => setRepayInstallment(inst)}
          onEarlySettlePlan={handleEarlySettlePlan}
          onOpenReceipt={(entry) => setSelectedReceipt(entry)}
          onCompleteBoostTask={handleCompleteBoostTask}
          onSetDefaultChannel={(channelId) => {
            setState((prev) => ({
              ...prev,
              users: prev.users.map((u) =>
                u.id === activeUser.id
                  ? {
                      ...u,
                      channels: u.channels.map((c) => ({
                        ...c,
                        isDefault: c.id === channelId,
                      })),
                    }
                  : u
              ),
            }));
            showToast('Default payout wallet updated');
          }}
          onRemoveChannel={(channelId) => {
            setState((prev) => ({
              ...prev,
              users: prev.users.map((u) =>
                u.id === activeUser.id
                  ? {
                      ...u,
                      channels: u.channels.filter((c) => c.id !== channelId),
                    }
                  : u
              ),
            }));
            showToast('Linked account removed');
          }}
          onOpenAddChannel={() => setAddChannelOpen(true)}
          onOpenChangePin={() => setChangePinOpen(true)}
          onOpenEditProfile={() => setEditProfileOpen(true)}
          onRelaunchOnboarding={() =>
            setState((prev) => ({
              ...prev,
              users: prev.users.map((u) =>
                u.id === activeUser.id
                  ? { ...u, onboardingCompleted: false }
                  : u
              ),
            }))
          }
          onChangeStatementDay={(day) => {
            setState((prev) => ({
              ...prev,
              users: prev.users.map((u) =>
                u.id === activeUser.id ? { ...u, statementDay: day } : u
              ),
            }));
            showToast(`Monthly statement cycle updated to the ${day}th`);
          }}
          onSubmitTicketOrFeedback={handleSubmitTicketOrFeedback}
          onReplyTicket={handleReplyTicket}
          onResetDemo={handleResetDemo}
          onLogout={handleLogout}
        />
      )}

      {/* MANAGER ROLE WORKSPACE */}
      {activeUser.role === UserRole.MANAGER && (
        <ManagerWorkspace
          activeTab={managerTab}
          state={state}
          user={activeUser}
          balanceMasked={balanceMasked}
          initialFocus={managerFocus}
          profileFocus={profileFocus}
          onNavigateTab={(t) => {
            setNotificationsOpen(false);
            setManagerTab(t);
          }}
          onToggleChecklist={handleToggleLoanChecklist}
          onDecideLoanRequest={handleDecideLoanRequest}
          onUpdateTicketStatus={handleUpdateTicketStatus}
          onReplyTicket={handleReplyTicket}
          onProfileSectionChange={setProfileSubSection}
          onCompleteBoostTask={handleCompleteBoostTask}
          onOpenAddChannel={() => setAddChannelOpen(true)}
          onOpenChangePin={() => setChangePinOpen(true)}
          onOpenEditProfile={() => setEditProfileOpen(true)}
          onSubmitTicketOrFeedback={handleSubmitTicketOrFeedback}
          onResetDemo={handleResetDemo}
          onLogout={handleLogout}
        />
      )}

      {/* ADMIN ROLE WORKSPACE */}
      {activeUser.role === UserRole.ADMIN && (
        <AdminWorkspace
          activeTab={adminTab}
          state={state}
          user={activeUser}
          balanceMasked={balanceMasked}
          currentAdminId={activeUser.id}
          initialFocus={adminFocus}
          profileFocus={profileFocus}
          onSubViewChange={setAdminSubLabel}
          onImpersonateUser={handleStartImpersonation}
          onCreateUser={handleAdminCreateUser}
          onUpdateUserAdmin={handleAdminUpdateUser}
          onResetUserPin={handleAdminResetPin}
          onDecideLoanRequest={handleDecideLoanRequest}
          onReopenLoanRequest={handleReopenLoanRequest}
          onUpdateTicketStatus={handleUpdateTicketStatus}
          onReplyTicket={handleReplyTicket}
          onCreateBackupSnapshot={handleCreateBackupSnapshot}
          onRestoreBackupSnapshot={handleRestoreBackupSnapshot}
          onImportJsonBackup={handleImportJsonBackup}
          onProfileSectionChange={setProfileSubSection}
          onCompleteBoostTask={handleCompleteBoostTask}
          onOpenAddChannel={() => setAddChannelOpen(true)}
          onOpenChangePin={() => setChangePinOpen(true)}
          onOpenEditProfile={() => setEditProfileOpen(true)}
          onSubmitTicketOrFeedback={handleSubmitTicketOrFeedback}
          onResetFactorySeed={handleResetDemo}
          onLogout={handleLogout}
        />
      )}
    </>
    )}
    </AppLayout>
  );
}
