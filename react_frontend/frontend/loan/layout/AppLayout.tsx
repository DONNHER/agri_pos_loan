import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  EyeOff,
  Home,
  Menu,
  ShieldAlert,
  ShoppingBag,
  X,
} from 'lucide-react';
import { getRoleLabel, PlatformUser } from '../shared/creditData';
import { APP_THEME, applyAppTheme } from '../shared/theme';
import { SafeImage } from '../shared/components/SafeImage';

export interface SidebarSubNavItem {
  id: string;
  label: string;
  isActive?: boolean;
  onSelect: () => void;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SidebarSubNavItem[];
}

export interface SubBreadcrumbTarget {
  label: string;
  onResetParent: () => void;
}

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared Theme Shell for Unauthenticated / Pre-Workspace Views (Login & Onboarding).
 * Automatically syncs `APP_THEME` tokens so changing `src/shared/theme.ts` updates all screens.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  useEffect(() => {
    applyAppTheme(APP_THEME);
  }, []);

  return <div className="min-h-screen bg-canvas text-ink">{children}</div>;
};

interface AppLayoutProps {
  activeUser: PlatformUser;
  impersonatorAdmin?: PlatformUser;
  navItems: SidebarNavItem[];
  activeNavId: string;
  notificationsOpen: boolean;
  unreadCount: number;
  notificationMenu?: React.ReactNode;
  activeSubBreadcrumb: SubBreadcrumbTarget | null;
  toastMessage: string | null;
  isPosOpen?: boolean;
  onTogglePos?: () => void;
  onSelectNav: (id: string) => void;
  onToggleNotifications: () => void;
  onCloseNotifications: () => void;
  onExitImpersonation: () => void;
  modals?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Unified Authenticated Application Layout Shell:
 * - Synchronizes `APP_THEME` CSS custom properties across the entire app
 * - Gmail-style Minimized Icon Rail + Floating Hover Mini-Sidebar Tab List & Persistent Expanded Sidebar
 * - Mobile Slide-Over Drawer
 * - Top Header Bar with Notification Bell + Mini Dropdown List before `@username`
 * - Interactive Multi-Level Breadcrumb Bar directly below `<header>`
 * - Live Admin Impersonation Banner & Toast Feedback
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  activeUser,
  impersonatorAdmin,
  navItems,
  activeNavId,
  notificationsOpen,
  unreadCount,
  notificationMenu,
  activeSubBreadcrumb,
  toastMessage,
  isPosOpen,
  onTogglePos,
  onSelectNav,
  onToggleNotifications,
  onCloseNotifications,
  onExitImpersonation,
  modals,
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);

  const isCurrentActiveItem = (itemId: string) => activeNavId === itemId;

  const clearFlyoutTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const closeFlyoutImmediately = () => {
    clearFlyoutTimer();
    setFlyoutOpen(false);
    setHoveredNavId(null);
  };

  const handleHoverRailItem = (itemId: string) => {
    if (isCurrentActiveItem(itemId)) {
      closeFlyoutImmediately();
      return;
    }
    clearFlyoutTimer();
    setHoveredNavId(itemId);
    setFlyoutOpen(true);
  };

  const keepFlyoutOpen = () => {
    clearFlyoutTimer();
  };

  const scheduleCloseFlyout = () => {
    clearFlyoutTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setFlyoutOpen(false);
      setHoveredNavId(null);
    }, 150);
  };

  useEffect(() => {
    applyAppTheme(APP_THEME);
    return () => clearFlyoutTimer();
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
    closeFlyoutImmediately();
  }, [activeNavId]);

  useEffect(() => {
    if (!sidebarCollapsed) {
      closeFlyoutImmediately();
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(event.target as Node)
      ) {
        onCloseNotifications();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [notificationsOpen, onCloseNotifications]);

  useEffect(() => {
    if (!mobileSidebarOpen && !flyoutOpen && !notificationsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
        closeFlyoutImmediately();
        onCloseNotifications();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileSidebarOpen, flyoutOpen, notificationsOpen, onCloseNotifications]);

  const handleSelectTab = (id: string) => {
    setMobileSidebarOpen(false);
    closeFlyoutImmediately();
    onCloseNotifications();
    onSelectNav(id);
  };

  const rootNavId = navItems[0]?.id || 'home';
  const currentTabLabel =
    navItems.find((n) => n.id === activeNavId)?.label || 'Workspace';

  const userInitials = activeUser.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderExpandedLinks = () => (
    <>
      <p className="px-3.5 pb-1.5 text-xs font-medium text-ink-muted truncate">
        {isPosOpen ? 'Agri-Store POS Menu' : `${getRoleLabel(activeUser.role)} Menu`}
      </p>
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeNavId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`w-full min-h-[42px] px-3.5 py-2 rounded-full flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-inverse text-ink-inverse font-semibold'
                  : 'text-ink-secondary hover:bg-subtle hover:text-ink font-medium'
              }`}
            >
              <IconComponent
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-brand' : 'text-current'
                }`}
              />
              <span className="text-sm truncate">{item.label}</span>
            </button>

            {isActive && item.subItems && item.subItems.length > 0 && (
              <div className="mt-1 mb-1.5 ml-6 pl-3 border-l border-line space-y-0.5">
                {item.subItems.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      closeFlyoutImmediately();
                      sub.onSelect();
                    }}
                    className={`w-full min-h-[34px] px-3 py-1.5 rounded-full text-left text-xs transition-colors cursor-pointer whitespace-nowrap truncate ${
                      sub.isActive
                        ? 'bg-brand-soft text-brand font-semibold'
                        : 'text-ink-secondary hover:bg-canvas hover:text-ink font-medium'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex">
      {/* Desktop Persistent Sidebar & Gmail-Style Minimized Rail + Hover Mini-Sidebar Flyout */}
      <aside
        aria-label="Primary sidebar navigation"
        className={`hidden lg:flex flex-col shrink-0 bg-surface border-r border-line sticky top-0 h-screen relative z-40 ${
          sidebarCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {/* Top Sidebar Rail Header with Hamburger Minimize/Expand Toggle */}
        <div
          className={`h-16 border-b border-line flex items-center shrink-0 ${
            sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3.5'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              closeFlyoutImmediately();
              setSidebarCollapsed((c) => !c);
            }}
            aria-label={
              sidebarCollapsed ? 'Expand sidebar menu' : 'Minimize sidebar menu'
            }
            title={sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            className="min-h-[42px] min-w-[42px] rounded-full flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-subtle transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => handleSelectTab(rootNavId)}
              className="font-display text-xl font-extrabold tracking-tight text-ink whitespace-nowrap shrink-0 cursor-pointer"
            >
              TikCredit
            </button>
          )}
        </div>

        {/* Navigation Links: Minimized Visible Icon Rail vs Full Expanded List */}
        {sidebarCollapsed ? (
          <nav
            aria-label="Minimized sidebar icons"
            onMouseLeave={scheduleCloseFlyout}
            className="flex-1 px-2 py-4 space-y-2 overflow-y-auto"
          >
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = isCurrentActiveItem(item.id);
              const isHovered = flyoutOpen && hoveredNavId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  onMouseEnter={() => handleHoverRailItem(item.id)}
                  onFocus={() => handleHoverRailItem(item.id)}
                  aria-label={item.label}
                  className="group w-full py-1.5 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span
                    className={`w-12 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-inverse text-ink-inverse'
                        : isHovered
                        ? 'bg-subtle text-ink'
                        : 'text-ink-secondary group-hover:bg-subtle group-hover:text-ink'
                    }`}
                  >
                    <IconComponent
                      className={`w-[18px] h-[18px] shrink-0 ${
                        isActive ? 'text-brand' : 'text-current'
                      }`}
                    />
                  </span>
                  <span
                    className={`text-[11px] leading-tight truncate max-w-[64px] ${
                      isActive
                        ? 'font-bold text-ink'
                        : 'font-medium text-ink-secondary group-hover:text-ink'
                    }`}
                  >
                    {item.shortLabel || item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        ) : (
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {renderExpandedLinks()}
          </nav>
        )}

        {/* Bottom User Profile Trigger */}
        <div
          onMouseEnter={
            sidebarCollapsed ? () => handleHoverRailItem('profile') : undefined
          }
          onMouseLeave={sidebarCollapsed ? scheduleCloseFlyout : undefined}
          className="border-t border-line p-3 shrink-0"
        >
          <button
            type="button"
            onClick={() => handleSelectTab('profile')}
            onFocus={
              sidebarCollapsed
                ? () => handleHoverRailItem('profile')
                : undefined
            }
            aria-label={`Open profile for ${activeUser.fullName}`}
            className={`w-full min-h-[48px] rounded-xl hover:bg-subtle flex items-center transition-colors cursor-pointer text-left ${
              sidebarCollapsed ? 'justify-center p-1.5' : 'gap-3 px-2.5 py-2'
            }`}
          >
            <SafeImage
              src={activeUser.avatarPath}
              alt={activeUser.fullName}
              fallbackText={userInitials}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink truncate">
                  {activeUser.fullName}
                </p>
                <p className="text-[11px] text-ink-secondary truncate">
                  {activeUser.handle} · {getRoleLabel(activeUser.role)}
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Gmail-Style Floating Hover Mini-Sidebar Tab List */}
        {sidebarCollapsed && flyoutOpen && (
          <div
            onMouseEnter={keepFlyoutOpen}
            onMouseLeave={scheduleCloseFlyout}
            className="absolute left-full top-3 pl-2 z-50"
          >
            <div
              role="menu"
              aria-label={`${getRoleLabel(activeUser.role)} mini sidebar`}
              className="w-64 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl bg-surface border border-line shadow-xl py-3 px-2.5 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="px-3 pb-2.5 mb-1.5 border-b border-line flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTab(rootNavId)}
                    className="font-display text-sm font-extrabold tracking-tight text-ink cursor-pointer"
                  >
                    TikCredit
                  </button>
                  <span className="text-[11px] font-medium text-ink-muted truncate">
                    {getRoleLabel(activeUser.role)} Menu
                  </span>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeNavId === item.id;
                    const isHoveredItem = hoveredNavId === item.id;
                    const showSubItems =
                      Boolean(item.subItems && item.subItems.length > 0) &&
                      (isHoveredItem || (!hoveredNavId && isActive));

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredNavId(item.id)}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full min-h-[40px] px-3.5 py-2 rounded-full flex items-center gap-3 text-left transition-colors cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-inverse text-ink-inverse font-semibold'
                              : isHoveredItem
                              ? 'bg-subtle text-ink font-semibold'
                              : 'text-ink-secondary hover:bg-subtle hover:text-ink font-medium'
                          }`}
                        >
                          <IconComponent
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-brand' : 'text-current'
                            }`}
                          />
                          <span className="text-sm truncate">{item.label}</span>
                        </button>

                        {showSubItems && item.subItems && (
                          <div className="mt-1 mb-1.5 ml-6 pl-3 border-l border-line space-y-0.5">
                            {item.subItems.map((sub) => (
                              <button
                                key={sub.id}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  closeFlyoutImmediately();
                                  setMobileSidebarOpen(false);
                                  sub.onSelect();
                                }}
                                className={`w-full min-h-[34px] px-3 py-1.5 rounded-full text-left text-xs transition-colors cursor-pointer whitespace-nowrap truncate ${
                                  sub.isActive
                                    ? 'bg-brand-soft text-brand font-semibold'
                                    : 'text-ink-secondary hover:bg-canvas hover:text-ink font-medium'
                                }`}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectTab('profile')}
                className="w-full min-h-[46px] px-2.5 py-2 rounded-xl bg-canvas hover:bg-subtle flex items-center gap-2.5 text-left transition-colors cursor-pointer"
              >
                <SafeImage
                  src={activeUser.avatarPath}
                  alt={activeUser.fullName}
                  fallbackText={userInitials}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink truncate">
                    {activeUser.fullName}
                  </p>
                  <p className="text-[11px] text-ink-secondary truncate">
                    {activeUser.handle}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile & Tablet Slide-Over Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar navigation menu"
        >
          <div
            className="fixed inset-0 bg-scrim/45 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          <aside className="relative z-10 w-72 max-w-[84vw] h-full bg-surface border-r border-line flex flex-col justify-between shadow-xl">
            <div className="h-16 px-5 border-b border-line flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectTab(rootNavId)}
                className="font-display text-xl font-extrabold tracking-tight text-ink whitespace-nowrap shrink-0 cursor-pointer"
              >
                TikCredit
              </button>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close sidebar menu"
                className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-canvas cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
              {renderExpandedLinks()}
            </nav>

            <div className="border-t border-line p-3 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectTab('profile')}
                className="w-full min-h-[48px] px-2.5 py-2 rounded-xl hover:bg-canvas flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <SafeImage
                  src={activeUser.avatarPath}
                  alt={activeUser.fullName}
                  fallbackText={userInitials}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink truncate">
                    {activeUser.fullName}
                  </p>
                  <p className="text-[11px] text-ink-secondary truncate">
                    {activeUser.handle} · {getRoleLabel(activeUser.role)}
                  </p>
                </div>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Right Workspace Column (Top Header + Breadcrumb Bar Below Header + Main Content) */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <header className="h-16 px-4 sm:px-6 lg:px-8 bg-surface border-b border-line flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar menu"
              className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 rounded-xl flex items-center justify-center text-ink hover:bg-canvas transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="lg:hidden font-display text-lg font-extrabold tracking-tight text-ink whitespace-nowrap shrink-0">
              TikCredit
            </span>
            <span className="hidden lg:inline font-display text-base font-bold text-ink truncate">
              {currentTabLabel}
            </span>
          </div>

          {/* Notification Bell icon + Store POS Module + Mini Notification List directly before @username */}
          <div className="flex items-center gap-2 shrink-0">
            {onTogglePos && (
              <button
                type="button"
                onClick={onTogglePos}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
                  isPosOpen
                    ? 'bg-brand text-on-brand'
                    : 'bg-subtle hover:bg-canvas border border-line text-ink'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-current" />
                <span>{isPosOpen ? 'Credit App' : 'Store POS'}</span>
              </button>
            )}

            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                onClick={onToggleNotifications}
                aria-expanded={notificationsOpen}
                aria-haspopup="menu"
                aria-label={`Notifications${
                  unreadCount > 0 ? `, ${unreadCount} unread` : ''
                }`}
                className={`relative min-h-[42px] min-w-[42px] px-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  notificationsOpen
                    ? 'bg-inverse text-ink-inverse'
                    : 'bg-canvas hover:bg-subtle text-ink'
                }`}
              >
                <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-on-brand text-[10px] font-mono tabular-nums font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && notificationMenu}
            </div>

            <button
              type="button"
              onClick={() => handleSelectTab('profile')}
              className={`min-h-[42px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeNavId === 'profile'
                  ? 'bg-inverse text-ink-inverse'
                  : 'bg-canvas hover:bg-subtle text-ink'
              }`}
            >
              {activeUser.handle}
            </button>
          </div>
        </header>

        {/* Breadcrumb Navigation Directly Below Header */}
        <nav
          aria-label="Breadcrumb"
          className="bg-surface/75 border-b border-line shrink-0"
        >
          <ol className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[40px] py-1.5 flex items-center gap-1.5 text-xs overflow-x-auto">
            <li className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => handleSelectTab(rootNavId)}
                className="min-h-[32px] px-1.5 -ml-1.5 rounded-lg inline-flex items-center gap-1.5 text-ink-secondary hover:text-ink hover:bg-subtle/70 font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>{getRoleLabel(activeUser.role)}</span>
              </button>
            </li>

            {activeSubBreadcrumb ? (
              <>
                <li aria-hidden="true" className="text-ink-muted shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={activeSubBreadcrumb.onResetParent}
                    className="min-h-[32px] px-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-subtle/70 font-medium transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {currentTabLabel}
                  </button>
                </li>
                <li aria-hidden="true" className="text-ink-muted shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li
                  aria-current="page"
                  className="px-1 font-semibold text-ink whitespace-nowrap shrink-0"
                >
                  {activeSubBreadcrumb.label}
                </li>
              </>
            ) : (
              <>
                <li aria-hidden="true" className="text-ink-muted shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li
                  aria-current="page"
                  className="px-1 font-semibold text-ink whitespace-nowrap shrink-0"
                >
                  {currentTabLabel}
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Toast Feedback */}
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

        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 space-y-5 flex-1">
          {impersonatorAdmin && (
            <div className="bg-inverse text-ink-inverse rounded-2xl px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs">
                <ShieldAlert className="w-4 h-4 text-accent shrink-0" />
                <span>
                  Admin <strong>{impersonatorAdmin.handle}</strong> is
                  impersonating <strong>{activeUser.fullName}</strong> (
                  {getRoleLabel(activeUser.role)})
                </span>
              </div>
              <button
                type="button"
                onClick={onExitImpersonation}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Return to Admin Console</span>
              </button>
            </div>
          )}

          {children}
        </main>
      </div>

      {modals}
    </div>
  );
};
