import React, { useState } from 'react';
import { PosLoginView } from './PosLoginView';
import { PosWorkspace, PosRole } from './PosWorkspace';
import { buildPosNav, PosSubTab } from './posNavigation';
import { AppLayout, SubBreadcrumbTarget } from '../loan/layout/AppLayout';
import { PlatformUser, UserRole } from '../loan/shared/creditData';

export const PosApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{
    role: PosRole;
    name: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<PosSubTab>('checkout');

  const handleLogin = (role: PosRole, cashierName: string) => {
    setCurrentUser({ role, name: cashierName });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <PosLoginView onLogin={handleLogin} />;
  }

  const mappedRole =
    currentUser.role === 'ADMIN'
      ? UserRole.ADMIN
      : currentUser.role === 'SHAREHOLDER'
      ? UserRole.SHAREHOLDER
      : UserRole.CASHIER;

  const mockUser: PlatformUser = {
    id: `pos-${currentUser.role.toLowerCase()}-1`,
    role: mappedRole,
    status: 'ACTIVE',
    fullName: currentUser.name,
    handle: `@${currentUser.name.toLowerCase().replace(/\s+/g, '')}`,
    phone: '+63 920 445 1199',
    email: `${currentUser.role.toLowerCase()}@tikcredit.ph`,
    password: '',
    accountId:
      currentUser.role === 'ADMIN'
        ? 'ADM-0001'
        : currentUser.role === 'SHAREHOLDER'
        ? 'SH-9102-2026'
        : 'CSH-1049',
    avatarPath: '',
    kycVerified: true,
    onboardingCompleted: true,
    statementDay: 15,
    securityPin: '123456',
    autoDebitEnabled: false,
    totalLimit: 0,
    shareCapital: 0,
    nationalId: 'N/A',
    cityAddress: 'Agri-Trading Store POS Terminal',
    incomeSource: 'Store Operations',
    monthlyIncome: 0,
    departmentOrBranch: 'Main Cooperative Store · Terminal 01',
    channels: [],
    boostTasks: [],
  };

  const posNav = buildPosNav({
    activeTab,
    isAdmin: currentUser.role === 'ADMIN',
    onSelectTab: (tab) => setActiveTab(tab),
  });

  const posBreadcrumbLabels: Record<PosSubTab, string> = {
    checkout: 'POS Register & Sales',
    inventory: 'Inventory & Bulk Breakdown',
    reports: 'Sales & Financial Reports',
    backups: 'Database & Backups',
    users: 'Store Users & Cashiers',
  };

  const activeBreadcrumb: SubBreadcrumbTarget = {
    label: posBreadcrumbLabels[activeTab] || 'POS Module',
    onResetParent: () => setActiveTab('checkout'),
  };

  return (
    <AppLayout
      activeUser={mockUser}
      navItems={posNav}
      activeNavId={activeTab}
      notificationsOpen={false}
      unreadCount={0}
      activeSubBreadcrumb={activeBreadcrumb}
      toastMessage={null}
      isPosOpen={true}
      onSelectNav={(id) => setActiveTab(id as PosSubTab)}
      onToggleNotifications={() => {}}
      onCloseNotifications={() => {}}
      onExitImpersonation={() => {}}
    >
      <PosWorkspace
        initialRole={currentUser.role}
        currentUserName={currentUser.name}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onExitPos={handleLogout}
      />
    </AppLayout>
  );
};
