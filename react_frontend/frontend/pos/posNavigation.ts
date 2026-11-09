import React from 'react';
import {
  Archive,
  BarChart3,
  Boxes,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { SidebarNavItem } from '../loan/layout/AppLayout';

export type PosSubTab =
  | 'checkout'
  | 'inventory'
  | 'reports'
  | 'backups'
  | 'users';

export interface BuildPosNavParams {
  activeTab: PosSubTab;
  isAdmin: boolean;
  selectedCategory?: string;
  selectedUnitFilter?: string;
  selectedReportChannel?: string;
  onSelectTab: (tab: PosSubTab) => void;
  onSelectCategoryFilter?: (category: string) => void;
  onSelectUnitFilter?: (unit: string) => void;
  onSelectReportChannel?: (channel: string) => void;
  onSelectUserRoleFilter?: (role: string) => void;
}

export function buildPosNav(params: BuildPosNavParams): SidebarNavItem[] {
  const {
    activeTab,
    isAdmin,
    selectedCategory = 'ALL',
    selectedUnitFilter = 'ALL',
    selectedReportChannel = 'ALL',
    onSelectTab,
    onSelectCategoryFilter,
    onSelectUnitFilter,
    onSelectReportChannel,
    onSelectUserRoleFilter,
  } = params;

  const navItems: SidebarNavItem[] = [
    {
      id: 'checkout',
      label: 'POS Register',
      shortLabel: 'Register',
      icon: ShoppingCart,
      subItems: [
        {
          id: 'pos-cat-all',
          label: 'All Categories',
          isActive: activeTab === 'checkout' && selectedCategory === 'ALL',
          onSelect: () => {
            onSelectTab('checkout');
            onSelectCategoryFilter?.('ALL');
          },
        },
        {
          id: 'pos-cat-seeds',
          label: 'Seeds & Grains',
          isActive:
            activeTab === 'checkout' && selectedCategory === 'Seeds & Grains',
          onSelect: () => {
            onSelectTab('checkout');
            onSelectCategoryFilter?.('Seeds & Grains');
          },
        },
        {
          id: 'pos-cat-fert',
          label: 'Fertilizers',
          isActive:
            activeTab === 'checkout' && selectedCategory === 'Fertilizers',
          onSelect: () => {
            onSelectTab('checkout');
            onSelectCategoryFilter?.('Fertilizers');
          },
        },
        {
          id: 'pos-cat-tools',
          label: 'Farm Tools',
          isActive:
            activeTab === 'checkout' && selectedCategory === 'Farm Tools',
          onSelect: () => {
            onSelectTab('checkout');
            onSelectCategoryFilter?.('Farm Tools');
          },
        },
      ],
    },
    {
      id: 'inventory',
      label: 'Multi-Unit Inventory',
      shortLabel: 'Inventory',
      icon: Boxes,
      subItems: [
        {
          id: 'pos-unit-all',
          label: 'All Products',
          isActive: activeTab === 'inventory' && selectedUnitFilter === 'ALL',
          onSelect: () => {
            onSelectTab('inventory');
            onSelectUnitFilter?.('ALL');
          },
        },
        {
          id: 'pos-unit-box',
          label: 'Per Box (Master)',
          isActive: activeTab === 'inventory' && selectedUnitFilter === 'box',
          onSelect: () => {
            onSelectTab('inventory');
            onSelectUnitFilter?.('box');
          },
        },
        {
          id: 'pos-unit-sack',
          label: 'Per Sack (Bulk)',
          isActive: activeTab === 'inventory' && selectedUnitFilter === 'sack',
          onSelect: () => {
            onSelectTab('inventory');
            onSelectUnitFilter?.('sack');
          },
        },
        {
          id: 'pos-unit-retail',
          label: 'Pieces & Kilograms',
          isActive:
            activeTab === 'inventory' &&
            (selectedUnitFilter === 'piece' || selectedUnitFilter === 'kg'),
          onSelect: () => {
            onSelectTab('inventory');
            onSelectUnitFilter?.('piece');
          },
        },
      ],
    },
    {
      id: 'reports',
      label: 'Sales Reports',
      shortLabel: 'Reports',
      icon: BarChart3,
      subItems: [
        {
          id: 'pos-rep-all',
          label: 'All Transactions',
          isActive: activeTab === 'reports' && selectedReportChannel === 'ALL',
          onSelect: () => {
            onSelectTab('reports');
            onSelectReportChannel?.('ALL');
          },
        },
        {
          id: 'pos-rep-cash',
          label: 'Cash Tendered',
          isActive: activeTab === 'reports' && selectedReportChannel === 'Cash',
          onSelect: () => {
            onSelectTab('reports');
            onSelectReportChannel?.('Cash');
          },
        },
        {
          id: 'pos-rep-credit',
          label: 'Co-op Credit Line',
          isActive:
            activeTab === 'reports' &&
            selectedReportChannel === 'Shareholder Credit Line',
          onSelect: () => {
            onSelectTab('reports');
            onSelectReportChannel?.('Shareholder Credit Line');
          },
        },
        {
          id: 'pos-rep-gcash',
          label: 'GCash / Digital',
          isActive:
            activeTab === 'reports' && selectedReportChannel === 'GCash',
          onSelect: () => {
            onSelectTab('reports');
            onSelectReportChannel?.('GCash');
          },
        },
      ],
    },
    {
      id: 'backups',
      label: 'Database & Backups',
      shortLabel: 'Backups',
      icon: Archive,
      subItems: [
        {
          id: 'pos-bak-snap',
          label: 'System Snapshots',
          isActive: activeTab === 'backups',
          onSelect: () => onSelectTab('backups'),
        },
      ],
    },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'users',
      label: 'Store Users & Cashiers',
      shortLabel: 'Cashiers',
      icon: Users,
      subItems: [
        {
          id: 'pos-user-cashier',
          label: 'Cashiers Tab',
          isActive: activeTab === 'users',
          onSelect: () => {
            onSelectTab('users');
            onSelectUserRoleFilter?.('CASHIER');
          },
        },
        {
          id: 'pos-user-all',
          label: 'All Platform Users',
          isActive: activeTab === 'users',
          onSelect: () => {
            onSelectTab('users');
            onSelectUserRoleFilter?.('ALL');
          },
        },
      ],
    });
  }

  return navItems;
}
