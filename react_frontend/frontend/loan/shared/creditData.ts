export type TenorMonths = 1 | 3 | 6 | 9 | 12;

export enum UserRole {
  SHAREHOLDER = 'SHAREHOLDER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
}

export enum PlanType {
  CASH_LOAN = 'CASH_LOAN',
}

export enum LoanRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum InstallmentStatus {
  UPCOMING = 'UPCOMING',
  PAID = 'PAID',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
}

export type NotificationCategory =
  | 'LOAN'
  | 'PAYMENT'
  | 'TICKET'
  | 'ACCOUNT'
  | 'APPROVAL';

export interface NotificationItem {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  referenceCode?: string;
}

export interface LinkedChannel {
  id: string;
  provider: 'GCash' | 'Maya' | 'GoTyme Bank' | 'BPI' | 'BDO' | 'UnionBank';
  accountMask: string;
  accountHolder: string;
  instantDisbursement: boolean;
  isDefault: boolean;
}

export interface InstallmentItem {
  id: string;
  userId: string;
  planId: string;
  planTitle: string;
  planType: PlanType;
  sequence: number;
  totalSequence: number;
  dueDate: string;
  principalPart: number;
  interestPart: number;
  totalDue: number;
  status: InstallmentStatus;
  paidAt?: string;
  paidVia?: string;
}

export interface CreditPlan {
  id: string;
  userId: string;
  referenceCode: string;
  title: string;
  type: PlanType;
  createdAt: string;
  principal: number;
  monthlyRatePct: number;
  tenor: TenorMonths;
  disbursedToOrMerchant: string;
  installments: InstallmentItem[];
}

export interface LoanRequestItem {
  id: string;
  referenceCode: string;
  userId: string;
  applicantName: string;
  applicantHandle: string;
  nationalId: string;
  applicantProfile: string;
  shareCapitalSnapshot: number;
  type: PlanType;
  purpose: string;
  principal: number;
  tenor: TenorMonths;
  monthlyRatePct: number;
  monthlyInstallment: number;
  totalRepayment: number;
  disbursementChannel: string;
  status: LoanRequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  checklist?: {
    kycVerified: boolean;
    shareCapitalChecked: boolean;
    repaymentCapacityChecked: boolean;
  };
}

export interface LedgerEntry {
  id: string;
  userId: string;
  referenceCode: string;
  title: string;
  subtitle: string;
  timestamp: string;
  amount: number;
  direction: 'INFLOW' | 'OUTFLOW' | 'REPAYMENT';
  channel: string;
  planType: PlanType;
}

export interface TicketReply {
  id: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  timestamp: string;
}

export interface SupportTicketItem {
  id: string;
  referenceCode: string;
  userId: string;
  userName: string;
  userHandle: string;
  kind: 'TICKET' | 'FEEDBACK';
  category:
    | 'Loan Approval & Disbursement'
    | 'Repayment & Billing'
    | 'Credit Limit & Share Capital'
    | 'Account & Security'
    | 'Service Experience';
  priority: 'Normal' | 'High' | 'Urgent';
  rating?: number;
  subject: string;
  description: string;
  relatedLoanRef?: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
}

export type AuditCategory =
  | 'AUTH'
  | 'IMPERSONATION'
  | 'ONBOARDING'
  | 'LOAN'
  | 'PAYMENT'
  | 'TICKET'
  | 'USER_MGMT'
  | 'BACKUP';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: AuditCategory;
  actorName: string;
  actorHandle: string;
  actorRole: UserRole;
  impersonatedBy?: string;
  action: string;
  target: string;
  details: string;
}

export interface BackupSnapshot {
  id: string;
  label: string;
  createdAt: string;
  createdBy: string;
  usersCount: number;
  loansCount: number;
  ticketsCount: number;
  totalVolumePHP: number;
  checksum: string;
  serializedData: string;
}

export interface LimitBoostTask {
  id: string;
  title: string;
  subtitle: string;
  boostAmount: number;
  completed: boolean;
  actionLabel: string;
}

export interface PlatformUser {
  id: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  fullName: string;
  handle: string;
  phone: string;
  email: string;
  password: string;
  accountId: string;
  avatarPath: string;
  kycVerified: boolean;
  onboardingCompleted: boolean;
  statementDay: 15 | 30;
  securityPin: string;
  autoDebitEnabled: boolean;
  // Shareholder / Borrower fields
  totalLimit: number;
  shareCapital: number;
  nationalId: string;
  cityAddress: string;
  incomeSource: string;
  monthlyIncome: number;
  channels: LinkedChannel[];
  boostTasks: LimitBoostTask[];
  // Staff fields
  departmentOrBranch?: string;
}

export interface PlatformState {
  activeUserId: string | null;
  impersonatorAdminId: string | null;
  users: PlatformUser[];
  loanRequests: LoanRequestItem[];
  plans: CreditPlan[];
  ledger: LedgerEntry[];
  tickets: SupportTicketItem[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  backups: BackupSnapshot[];
}

export const TENOR_OPTIONS: TenorMonths[] = [1, 3, 6, 9, 12];

export const CASH_LOAN_MONTHLY_RATES: Record<TenorMonths, number> = {
  1: 1.5,
  3: 1.85,
  6: 1.95,
  9: 2.1,
  12: 2.25,
};

export const GENERATED_ASSETS = {
  avatarShareholder: '/frontend/loan/assets/images/user_profile_avatar_1793663943185.jpg',
  avatarManager: '/frontend/loan/assets/images/avatar_loan_manager_1793675765849.jpg',
  avatarAdmin: '/frontend/loan/assets/images/avatar_system_admin_1793675767324.jpg',
};

export function formatPHP(amount: number, masked = false): string {
  if (masked) {
    return '₱••,•••.••';
  }
  return (
    '₱' +
    amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatNowTimestamp(): string {
  const now = new Date();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const m = months[now.getMonth()];
  const d = now.getDate();
  const y = now.getFullYear();
  const hrs = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  const hr12 = hrs % 12 || 12;
  return `${m} ${d}, ${y} · ${String(hr12).padStart(2, '0')}:${mins} ${ampm}`;
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.SHAREHOLDER:
      return 'Shareholder';
    case UserRole.MANAGER:
      return 'Loan Manager';
    case UserRole.ADMIN:
      return 'System Admin';
    case UserRole.CASHIER:
      return 'Store Cashier';
  }
}

export interface LoanQuote {
  principal: number;
  tenor: TenorMonths;
  monthlyRatePct: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  monthlyInstallment: number;
  totalInterest: number;
  totalRepayment: number;
  processingFee: number;
  scheduleDates: string[];
}

export function buildFutureDueDates(
  tenor: TenorMonths,
  statementDay: 15 | 30 = 15
): string[] {
  const baseYear = 2026;
  const baseMonthIndex = 10; // Nov 2026
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const dates: string[] = [];
  for (let i = 1; i <= tenor; i++) {
    const targetMonthTotal = baseMonthIndex + i;
    const year = baseYear + Math.floor(targetMonthTotal / 12);
    const monthIdx = targetMonthTotal % 12;
    const safeDay = monthIdx === 1 && statementDay === 30 ? 28 : statementDay;
    dates.push(`${monthNames[monthIdx]} ${safeDay}, ${year}`);
  }
  return dates;
}

export function calculateLoanQuote(
  principal: number,
  tenor: TenorMonths,
  _type: PlanType = PlanType.CASH_LOAN,
  statementDay: 15 | 30 = 15
): LoanQuote {
  const safePrincipal = Math.max(0, principal);
  const monthlyRatePct = CASH_LOAN_MONTHLY_RATES[tenor];

  const monthlyPrincipal = Number((safePrincipal / tenor).toFixed(2));
  const monthlyInterest = Number(
    ((safePrincipal * monthlyRatePct) / 100).toFixed(2)
  );
  const monthlyInstallment = Number(
    (monthlyPrincipal + monthlyInterest).toFixed(2)
  );
  const totalInterest = Number((monthlyInterest * tenor).toFixed(2));
  const totalRepayment = Number((safePrincipal + totalInterest).toFixed(2));

  return {
    principal: safePrincipal,
    tenor,
    monthlyRatePct,
    monthlyPrincipal,
    monthlyInterest,
    monthlyInstallment,
    totalInterest,
    totalRepayment,
    processingFee: 0,
    scheduleDates: buildFutureDueDates(tenor, statementDay),
  };
}

export function computeUserCreditSummary(state: PlatformState, userId: string) {
  const user = state.users.find((u) => u.id === userId);
  const totalLimit = user?.totalLimit || 0;

  let usedPrincipal = 0;
  let totalOutstandingWithInterest = 0;
  const upcomingInstallments: InstallmentItem[] = [];

  const userPlans = state.plans.filter((p) => p.userId === userId);
  for (const plan of userPlans) {
    for (const inst of plan.installments) {
      if (inst.status === InstallmentStatus.UPCOMING) {
        usedPrincipal += inst.principalPart;
        totalOutstandingWithInterest += inst.totalDue;
        upcomingInstallments.push(inst);
      }
    }
  }

  const pendingRequests = state.loanRequests.filter(
    (r) => r.userId === userId && r.status === LoanRequestStatus.PENDING
  );
  const reservedPendingPrincipal = pendingRequests.reduce(
    (acc, r) => acc + r.principal,
    0
  );

  usedPrincipal = Number(usedPrincipal.toFixed(2));
  totalOutstandingWithInterest = Number(totalOutstandingWithInterest.toFixed(2));
  const availableCredit = Math.max(
    0,
    Number((totalLimit - usedPrincipal - reservedPendingPrincipal).toFixed(2))
  );
  const utilizationPct =
    totalLimit > 0
      ? Math.min(
          100,
          Math.round(((usedPrincipal + reservedPendingPrincipal) / totalLimit) * 100)
        )
      : 0;

  const userNotifications = (state.notifications || []).filter(
    (n) => n.userId === userId
  );
  const unreadNotificationsCount = userNotifications.filter(
    (n) => !n.read
  ).length;

  return {
    totalLimit,
    availableCredit,
    usedPrincipal,
    reservedPendingPrincipal,
    totalOutstandingWithInterest,
    utilizationPct,
    upcomingInstallments,
    nextInstallment: upcomingInstallments[0] || null,
    userPlans,
    userLedger: state.ledger.filter((l) => l.userId === userId),
    userLoanRequests: state.loanRequests.filter((r) => r.userId === userId),
    userTickets: state.tickets.filter((t) => t.userId === userId),
    userNotifications,
    unreadNotificationsCount,
  };
}

export function createInitialPlatformState(): PlatformState {
  const users: PlatformUser[] = [
    {
      id: 'user-shareholder-1',
      role: UserRole.SHAREHOLDER,
      status: 'ACTIVE',
      fullName: 'Dionherlove Cuarteros',
      handle: '@dionherlove',
      phone: '+63 917 482 1904',
      email: 'shareholder@tikcredit.ph',
      password: 'password123',
      accountId: 'SH-8849-2026',
      avatarPath: GENERATED_ASSETS.avatarShareholder,
      kycVerified: true,
      onboardingCompleted: true,
      statementDay: 15,
      securityPin: '123456',
      autoDebitEnabled: false,
      totalLimit: 50000,
      shareCapital: 18500,
      nationalId: 'PHN-8492-1048-2026',
      cityAddress: 'Makati City, Metro Manila',
      incomeSource: 'Salaried · Digital Operations',
      monthlyIncome: 48000,
      channels: [
        {
          id: 'ch-gcash-1',
          provider: 'GCash',
          accountMask: '•••• 4821',
          accountHolder: 'Dionherlove Cuarteros',
          instantDisbursement: true,
          isDefault: true,
        },
        {
          id: 'ch-bpi-1',
          provider: 'BPI',
          accountMask: '•••• 7702',
          accountHolder: 'Dionherlove Cuarteros',
          instantDisbursement: true,
          isDefault: false,
        },
        {
          id: 'ch-maya-1',
          provider: 'Maya',
          accountMask: '•••• 9104',
          accountHolder: 'Dionherlove C.',
          instantDisbursement: true,
          isDefault: false,
        },
      ],
      boostTasks: [
        {
          id: 'boost-id',
          title: 'Government National ID & Biometric KYC',
          subtitle: 'Verified Oct 2026 · Tier 1 Member',
          boostAmount: 15000,
          completed: true,
          actionLabel: 'Verified',
        },
        {
          id: 'boost-share',
          title: 'Paid-Up Shareholder Capital (≥ ₱15,000)',
          subtitle: 'Current capital standing: ₱18,500.00',
          boostAmount: 10000,
          completed: true,
          actionLabel: 'Qualified',
        },
        {
          id: 'boost-income',
          title: 'Upload Latest Payslip or Bank Statement',
          subtitle: 'Unlock higher revolving cash credit ceiling',
          boostAmount: 15000,
          completed: false,
          actionLabel: 'Verify +₱15,000',
        },
        {
          id: 'boost-autodebit',
          title: 'Enable Monthly Statement Auto-Debit',
          subtitle: 'Zero late fees on monthly billing cycles',
          boostAmount: 5000,
          completed: false,
          actionLabel: 'Enable +₱5,000',
        },
      ],
    },
    {
      id: 'user-shareholder-2',
      role: UserRole.SHAREHOLDER,
      status: 'ACTIVE',
      fullName: 'Mateo Villanueva',
      handle: '@mateov',
      phone: '+63 919 634 8820',
      email: 'mateo@tikcredit.ph',
      password: 'password123',
      accountId: 'SH-9102-2026',
      avatarPath: '',
      kycVerified: false,
      onboardingCompleted: false,
      statementDay: 30,
      securityPin: '123456',
      autoDebitEnabled: false,
      totalLimit: 35000,
      shareCapital: 12000,
      nationalId: 'PHN-5520-3910-2026',
      cityAddress: 'Quezon City, Metro Manila',
      incomeSource: 'Small Business & Freelance',
      monthlyIncome: 38000,
      channels: [
        {
          id: 'ch-gcash-2',
          provider: 'GCash',
          accountMask: '•••• 8820',
          accountHolder: 'Mateo Villanueva',
          instantDisbursement: true,
          isDefault: true,
        },
      ],
      boostTasks: [
        {
          id: 'boost-m1',
          title: 'Complete Member Onboarding & ID Verification',
          subtitle: 'Activates revolving personal cash credit line',
          boostAmount: 10000,
          completed: false,
          actionLabel: 'Verify +₱10,000',
        },
      ],
    },
    {
      id: 'user-manager-1',
      role: UserRole.MANAGER,
      status: 'ACTIVE',
      fullName: 'Marcus Reyes',
      handle: '@marcus.mgr',
      phone: '+63 918 550 2210',
      email: 'manager@tikcredit.ph',
      password: 'password123',
      accountId: 'MGR-0204',
      avatarPath: GENERATED_ASSETS.avatarManager,
      kycVerified: true,
      onboardingCompleted: true,
      statementDay: 15,
      securityPin: '123456',
      autoDebitEnabled: false,
      totalLimit: 0,
      shareCapital: 0,
      nationalId: 'N/A',
      cityAddress: 'Metro Manila Lending Hub',
      incomeSource: 'N/A',
      monthlyIncome: 0,
      departmentOrBranch: 'Metro Manila Credit Underwriting',
      channels: [],
      boostTasks: [],
    },
    {
      id: 'user-admin-1',
      role: UserRole.ADMIN,
      status: 'ACTIVE',
      fullName: 'Elena Soriano',
      handle: '@elena.admin',
      phone: '+63 917 900 1100',
      email: 'admin@tikcredit.ph',
      password: 'password123',
      accountId: 'ADM-0001',
      avatarPath: GENERATED_ASSETS.avatarAdmin,
      kycVerified: true,
      onboardingCompleted: true,
      statementDay: 15,
      securityPin: '123456',
      autoDebitEnabled: false,
      totalLimit: 0,
      shareCapital: 0,
      nationalId: 'N/A',
      cityAddress: 'Head Office · Risk & Compliance',
      incomeSource: 'N/A',
      monthlyIncome: 0,
      departmentOrBranch: 'Platform Administration & Audit',
      channels: [],
      boostTasks: [],
    },
    {
      id: 'user-cashier-1',
      role: UserRole.CASHIER,
      status: 'ACTIVE',
      fullName: 'Maria Santos',
      handle: '@maria.cashier',
      phone: '+63 920 445 1199',
      email: 'cashier@tikcredit.ph',
      password: 'password123',
      accountId: 'CSH-1049',
      avatarPath: '',
      kycVerified: true,
      onboardingCompleted: true,
      statementDay: 15,
      securityPin: '123456',
      autoDebitEnabled: false,
      totalLimit: 0,
      shareCapital: 0,
      nationalId: 'PHN-3310-8821-2026',
      cityAddress: 'Agri-Trading Store POS Counter 1',
      incomeSource: 'Store Operations Staff',
      monthlyIncome: 24000,
      departmentOrBranch: 'Main Cooperative Store · Terminal 01',
      channels: [],
      boostTasks: [],
    },
    {
      id: 'user-cashier-2',
      role: UserRole.CASHIER,
      status: 'ACTIVE',
      fullName: 'Juan Gomez',
      handle: '@juan.csh2',
      phone: '+63 919 778 3341',
      email: 'juan.pos@tikcredit.ph',
      password: 'password123',
      accountId: 'CSH-1052',
      avatarPath: '',
      kycVerified: true,
      onboardingCompleted: true,
      statementDay: 15,
      securityPin: '123456',
      autoDebitEnabled: false,
      totalLimit: 0,
      shareCapital: 0,
      nationalId: 'PHN-4491-9920-2026',
      cityAddress: 'Fertilizer Warehouse & Express Register',
      incomeSource: 'Warehouse Dispatch Cashier',
      monthlyIncome: 22000,
      departmentOrBranch: 'Warehouse Express · Register 02',
      channels: [],
      boostTasks: [],
    },
  ];

  const loanRequests: LoanRequestItem[] = [
    {
      id: 'req-seed-101',
      referenceCode: 'LRQ-202611-408',
      userId: 'user-shareholder-1',
      applicantName: 'Dionherlove Cuarteros',
      applicantHandle: '@dionherlove',
      nationalId: 'PHN-8492-1048-2026',
      applicantProfile: 'Makati City · ₱48,000/mo · Salaried · Digital Operations',
      shareCapitalSnapshot: 18500,
      type: PlanType.CASH_LOAN,
      purpose: 'Home Office Laptop & Workspace Upgrade',
      principal: 9000,
      tenor: 3,
      monthlyRatePct: 1.85,
      monthlyInstallment: 3166.5,
      totalRepayment: 9499.5,
      disbursementChannel: 'GCash •••• 4821',
      status: LoanRequestStatus.PENDING,
      createdAt: 'Nov 2, 2026 · 01:15 PM',
      checklist: {
        kycVerified: true,
        shareCapitalChecked: true,
        repaymentCapacityChecked: false,
      },
    },
    {
      id: 'req-seed-102',
      referenceCode: 'LRQ-202611-409',
      userId: 'user-shareholder-2',
      applicantName: 'Mateo Villanueva',
      applicantHandle: '@mateov',
      nationalId: 'PHN-5520-3910-2026',
      applicantProfile: 'Quezon City · ₱38,000/mo · Small Business & Freelance',
      shareCapitalSnapshot: 12000,
      type: PlanType.CASH_LOAN,
      purpose: 'Medical & Emergency Cash Buffer',
      principal: 12000,
      tenor: 6,
      monthlyRatePct: 1.95,
      monthlyInstallment: 2234,
      totalRepayment: 13404,
      disbursementChannel: 'GCash •••• 8820',
      status: LoanRequestStatus.PENDING,
      createdAt: 'Nov 2, 2026 · 02:30 PM',
      checklist: {
        kycVerified: false,
        shareCapitalChecked: true,
        repaymentCapacityChecked: false,
      },
    },
    {
      id: 'req-seed-100',
      referenceCode: 'LRQ-202610-312',
      userId: 'user-shareholder-1',
      applicantName: 'Dionherlove Cuarteros',
      applicantHandle: '@dionherlove',
      nationalId: 'PHN-8492-1048-2026',
      applicantProfile: 'Makati City · ₱48,000/mo · Salaried · Digital Operations',
      shareCapitalSnapshot: 18500,
      type: PlanType.CASH_LOAN,
      purpose: 'Personal Cash & Bill Consolidation',
      principal: 7500,
      tenor: 3,
      monthlyRatePct: 1.85,
      monthlyInstallment: 2638.75,
      totalRepayment: 7916.25,
      disbursementChannel: 'GCash •••• 4821',
      status: LoanRequestStatus.APPROVED,
      createdAt: 'Oct 14, 2026 · 09:30 AM',
      reviewedBy: 'Marcus Reyes (@marcus.mgr)',
      reviewedAt: 'Oct 14, 2026 · 09:40 AM',
      reviewNote:
        'Verified National ID KYC, monthly income capacity, and share capital standing.',
      checklist: {
        kycVerified: true,
        shareCapitalChecked: true,
        repaymentCapacityChecked: true,
      },
    },
  ];

  const plans: CreditPlan[] = [
    {
      id: 'plan-initial-1',
      userId: 'user-shareholder-1',
      referenceCode: 'TCL-202610-4912',
      title: 'Personal Cash & Bill Consolidation',
      type: PlanType.CASH_LOAN,
      createdAt: 'Oct 14, 2026',
      principal: 7500,
      monthlyRatePct: 1.85,
      tenor: 3,
      disbursedToOrMerchant: 'GCash •••• 4821',
      installments: [
        {
          id: 'inst-init-1',
          userId: 'user-shareholder-1',
          planId: 'plan-initial-1',
          planTitle: 'Personal Cash & Bill Consolidation',
          planType: PlanType.CASH_LOAN,
          sequence: 1,
          totalSequence: 3,
          dueDate: 'Oct 15, 2026',
          principalPart: 2500,
          interestPart: 138.75,
          totalDue: 2638.75,
          status: InstallmentStatus.PAID,
          paidAt: 'Oct 15, 2026',
          paidVia: 'GCash •••• 4821',
        },
        {
          id: 'inst-init-2',
          userId: 'user-shareholder-1',
          planId: 'plan-initial-1',
          planTitle: 'Personal Cash & Bill Consolidation',
          planType: PlanType.CASH_LOAN,
          sequence: 2,
          totalSequence: 3,
          dueDate: 'Nov 15, 2026',
          principalPart: 2500,
          interestPart: 138.75,
          totalDue: 2638.75,
          status: InstallmentStatus.UPCOMING,
        },
        {
          id: 'inst-init-3',
          userId: 'user-shareholder-1',
          planId: 'plan-initial-1',
          planTitle: 'Personal Cash & Bill Consolidation',
          planType: PlanType.CASH_LOAN,
          sequence: 3,
          totalSequence: 3,
          dueDate: 'Dec 15, 2026',
          principalPart: 2500,
          interestPart: 138.75,
          totalDue: 2638.75,
          status: InstallmentStatus.UPCOMING,
        },
      ],
    },
    {
      id: 'plan-initial-0',
      userId: 'user-shareholder-1',
      referenceCode: 'TCL-202609-1180',
      title: 'Short-Term Emergency Cash Loan',
      type: PlanType.CASH_LOAN,
      createdAt: 'Sep 15, 2026',
      principal: 6000,
      monthlyRatePct: 1.5,
      tenor: 1,
      disbursedToOrMerchant: 'GCash •••• 4821',
      installments: [
        {
          id: 'inst-init-0',
          userId: 'user-shareholder-1',
          planId: 'plan-initial-0',
          planTitle: 'Short-Term Emergency Cash Loan',
          planType: PlanType.CASH_LOAN,
          sequence: 1,
          totalSequence: 1,
          dueDate: 'Oct 15, 2026',
          principalPart: 6000,
          interestPart: 90,
          totalDue: 6090,
          status: InstallmentStatus.PAID,
          paidAt: 'Oct 12, 2026',
          paidVia: 'BPI •••• 7702',
        },
      ],
    },
  ];

  const ledger: LedgerEntry[] = [
    {
      id: 'led-1',
      userId: 'user-shareholder-1',
      referenceCode: 'PAY-994012',
      title: 'Installment 1/3 Repayment',
      subtitle: 'Personal Cash & Bill Consolidation',
      timestamp: 'Oct 15, 2026 · 09:42 AM',
      amount: 2638.75,
      direction: 'REPAYMENT',
      channel: 'GCash •••• 4821',
      planType: PlanType.CASH_LOAN,
    },
    {
      id: 'led-2',
      userId: 'user-shareholder-1',
      referenceCode: 'TCL-202610-4912',
      title: 'Cash Loan Approved & Disbursed',
      subtitle: 'Personal Cash & Bill Consolidation · GCash •••• 4821',
      timestamp: 'Oct 14, 2026 · 09:40 AM',
      amount: 7500,
      direction: 'INFLOW',
      channel: 'GCash •••• 4821',
      planType: PlanType.CASH_LOAN,
    },
    {
      id: 'led-3',
      userId: 'user-shareholder-1',
      referenceCode: 'PAY-881204',
      title: 'Full Cash Loan Settlement',
      subtitle: 'Short-Term Emergency Cash Loan · Paid Early',
      timestamp: 'Oct 12, 2026 · 04:18 PM',
      amount: 6090,
      direction: 'REPAYMENT',
      channel: 'BPI •••• 7702',
      planType: PlanType.CASH_LOAN,
    },
    {
      id: 'led-4',
      userId: 'user-shareholder-1',
      referenceCode: 'TCL-202609-1180',
      title: 'Cash Loan Disbursed',
      subtitle: 'Short-Term Emergency Cash Loan · GCash •••• 4821',
      timestamp: 'Sep 15, 2026 · 11:05 AM',
      amount: 6000,
      direction: 'INFLOW',
      channel: 'GCash •••• 4821',
      planType: PlanType.CASH_LOAN,
    },
  ];

  const tickets: SupportTicketItem[] = [
    {
      id: 'tkt-101',
      referenceCode: 'TKT-2026-801',
      userId: 'user-shareholder-1',
      userName: 'Dionherlove Cuarteros',
      userHandle: '@dionherlove',
      kind: 'TICKET',
      category: 'Loan Approval & Disbursement',
      priority: 'High',
      subject: 'Expedite workspace upgrade cash loan review',
      description:
        'Submitted LRQ-202611-408 (₱9,000) for my Home Office Laptop & Workspace Upgrade. Requesting underwriting verification today for instant GCash payout.',
      relatedLoanRef: 'LRQ-202611-408',
      status: TicketStatus.OPEN,
      createdAt: 'Nov 2, 2026 · 01:22 PM',
      updatedAt: 'Nov 2, 2026 · 01:22 PM',
      replies: [],
    },
    {
      id: 'tkt-102',
      referenceCode: 'FDB-2026-304',
      userId: 'user-shareholder-1',
      userName: 'Dionherlove Cuarteros',
      userHandle: '@dionherlove',
      kind: 'FEEDBACK',
      category: 'Service Experience',
      priority: 'Normal',
      rating: 5,
      subject: 'Instant GCash disbursement and clear monthly schedule',
      description:
        'Splitting my ₱7,500 personal cash loan over 3 monthly installments made budgeting predictable with zero origination fees.',
      relatedLoanRef: 'TCL-202610-4912',
      status: TicketStatus.RESOLVED,
      createdAt: 'Oct 20, 2026 · 05:10 PM',
      updatedAt: 'Oct 21, 2026 · 08:45 AM',
      replies: [
        {
          id: 'rep-1',
          authorName: 'Marcus Reyes',
          authorRole: UserRole.MANAGER,
          message:
            'Thank you for sharing this feedback, Dionherlove! Your consistent repayment record qualifies your account for revolving credit limit boosts.',
          timestamp: 'Oct 21, 2026 · 08:45 AM',
        },
      ],
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'user-shareholder-1',
      category: 'LOAN',
      title: 'Loan Request Pending Review',
      message: '₱9,000.00 (3m) · Home Office Laptop & Workspace Upgrade',
      timestamp: 'Nov 2, 2026 · 01:15 PM',
      read: false,
      referenceCode: 'LRQ-202611-408',
    },
    {
      id: 'notif-2',
      userId: 'user-shareholder-1',
      category: 'PAYMENT',
      title: 'Statement Due Nov 15',
      message: '₱2,638.75 · Installment 2/3 · Personal Cash & Bill Consolidation',
      timestamp: 'Nov 1, 2026 · 09:00 AM',
      read: false,
      referenceCode: 'TCL-202610-4912',
    },
    {
      id: 'notif-3',
      userId: 'user-shareholder-1',
      category: 'TICKET',
      title: 'Support Reply · FDB-2026-304',
      message: 'Marcus Reyes replied and marked your feedback Resolved',
      timestamp: 'Oct 21, 2026 · 08:45 AM',
      read: true,
      referenceCode: 'FDB-2026-304',
    },
    {
      id: 'notif-4',
      userId: 'user-shareholder-1',
      category: 'APPROVAL',
      title: 'Cash Loan Approved & Disbursed',
      message: '+₱7,500.00 · GCash •••• 4821 · Personal Cash & Bill Consolidation',
      timestamp: 'Oct 14, 2026 · 09:40 AM',
      read: true,
      referenceCode: 'TCL-202610-4912',
    },
    {
      id: 'notif-mgr-1',
      userId: 'user-manager-1',
      category: 'APPROVAL',
      title: '2 Loan Requests Pending',
      message: '@dionherlove (₱9,000) & @mateov (₱12,000) awaiting verification',
      timestamp: 'Nov 2, 2026 · 02:30 PM',
      read: false,
      referenceCode: 'LRQ-202611-408',
    },
    {
      id: 'notif-mgr-2',
      userId: 'user-manager-1',
      category: 'TICKET',
      title: 'High-Priority Ticket · TKT-2026-801',
      message: '@dionherlove · Expedite workspace upgrade cash loan review',
      timestamp: 'Nov 2, 2026 · 01:22 PM',
      read: false,
      referenceCode: 'TKT-2026-801',
    },
    {
      id: 'notif-adm-1',
      userId: 'user-admin-1',
      category: 'APPROVAL',
      title: '2 Pending Loans & 1 Open Ticket',
      message: 'Underwriting queue and support desk awaiting review',
      timestamp: 'Nov 2, 2026 · 02:30 PM',
      read: false,
      referenceCode: 'LRQ-202611-409',
    },
    {
      id: 'notif-adm-2',
      userId: 'user-admin-1',
      category: 'ACCOUNT',
      title: 'Daily Backup Snapshot Verified',
      message: 'SHA256-9F4C2A8E · 4 accounts saved',
      timestamp: 'Nov 2, 2026 · 08:00 AM',
      read: true,
      referenceCode: 'SHA256-9F4C2A8E',
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'log-1',
      timestamp: 'Nov 2, 2026 · 02:30 PM',
      category: 'LOAN',
      actorName: 'Mateo Villanueva',
      actorHandle: '@mateov',
      actorRole: UserRole.SHAREHOLDER,
      action: 'LOAN_REQUEST_SUBMITTED',
      target: 'LRQ-202611-409',
      details: 'Requested ₱12,000.00 (6 mos) for Medical & Emergency Cash Buffer',
    },
    {
      id: 'log-2',
      timestamp: 'Nov 2, 2026 · 01:22 PM',
      category: 'TICKET',
      actorName: 'Dionherlove Cuarteros',
      actorHandle: '@dionherlove',
      actorRole: UserRole.SHAREHOLDER,
      action: 'TICKET_OPENED',
      target: 'TKT-2026-801',
      details: 'High-priority ticket linked to LRQ-202611-408',
    },
    {
      id: 'log-3',
      timestamp: 'Nov 2, 2026 · 01:15 PM',
      category: 'LOAN',
      actorName: 'Dionherlove Cuarteros',
      actorHandle: '@dionherlove',
      actorRole: UserRole.SHAREHOLDER,
      action: 'LOAN_REQUEST_SUBMITTED',
      target: 'LRQ-202611-408',
      details:
        'Requested ₱9,000.00 (3 mos) for Home Office Laptop & Workspace Upgrade',
    },
    {
      id: 'log-4',
      timestamp: 'Oct 15, 2026 · 09:42 AM',
      category: 'PAYMENT',
      actorName: 'Dionherlove Cuarteros',
      actorHandle: '@dionherlove',
      actorRole: UserRole.SHAREHOLDER,
      action: 'INSTALLMENT_PAID',
      target: 'PAY-994012',
      details: 'Paid ₱2,638.75 via GCash •••• 4821 · Restored ₱2,500.00 credit',
    },
    {
      id: 'log-5',
      timestamp: 'Oct 14, 2026 · 09:40 AM',
      category: 'LOAN',
      actorName: 'Marcus Reyes',
      actorHandle: '@marcus.mgr',
      actorRole: UserRole.MANAGER,
      action: 'LOAN_APPROVED',
      target: 'LRQ-202610-312',
      details:
        'Verified National ID KYC & share capital; approved ₱7,500.00 Cash Loan',
    },
  ];

  const seedWithoutBackups = {
    activeUserId: null,
    impersonatorAdminId: null,
    users,
    loanRequests,
    plans,
    ledger,
    tickets,
    notifications,
    auditLogs,
    backups: [] as BackupSnapshot[],
  };

  const initialBackup: BackupSnapshot = {
    id: 'bkp-seed-1',
    label: 'Automated Daily Baseline Snapshot',
    createdAt: 'Nov 2, 2026 · 08:00 AM',
    createdBy: 'Elena Soriano (@elena.admin)',
    usersCount: users.length,
    loansCount: loanRequests.length,
    ticketsCount: tickets.length,
    totalVolumePHP: 28500,
    checksum: 'SHA256-9F4C2A8E',
    serializedData: JSON.stringify(seedWithoutBackups),
  };

  return {
    ...seedWithoutBackups,
    backups: [initialBackup],
  };
}
