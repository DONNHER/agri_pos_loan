Integrated Agrivet POS & Farmer Loan Management System
Frontend Engineering & Execution Plan — React + Tailwind CSS on a Laravel API

Operating principle for every phase: each unit of work runs the same micro-loop — Spec (write the component contract: props, states, breakpoints, keyboard map) → Build (implement in isolation) → Verify (visual check at 360px / 768px / 1280px+, interaction test, a11y pass) → Refine (fold findings back into tokens/primitives, never into one-off overrides). No component ships until the loop closes at all three viewport classes: mobile farmer view (360–640px), tablet dashboard (768–1024px), desktop counter POS (1280px+).

---

## 📋 Phase Status Tracker

### Phase 1: Environment, Responsive Architecture & Design System Foundation
- **1.1 VS Code Workspace & Tooling Setup** — `[COMPLETED]`
- **1.2 Responsive Layout & Token Architecture** — `[COMPLETED]`
- **1.3 Atomic Cross-Screen Component Library** — `[COMPLETED]`

### Phase 2: Core POS & Keyboard-First Responsive Engine
- **2.1 Multi-Device POS Layouts** — `[COMPLETED]`
  - ✅ Created `src/features/pos/` with complete POS feature module
  - ✅ `useHotkeys` hook with global keymap (F2 search, F4 cash, F9 credit, F6 split, +/− qty, Del void, Esc cancel)
  - ✅ `useScannerBurst` hook for barcode scanner detection
  - ✅ Three-zone desktop layout: ProductSearch (left), Cart (center), TenderPanel (right)
  - ✅ Tablet layout: collapsible grid with category quick-pick tiles
  - ✅ Mobile layout: stacked flow with sticky bottom action bar
  - ✅ POS route added at `/pos` with ProtectedRoute
  - ✅ All components use design system tokens (forest, credit, danger, surface)
- **2.2 Client-Side State & Offline LAN Resilience** — `[COMPLETED]`
  - ✅ Zustand store with IndexedDB persistence (idb-keyval) for cart, tender, farmer, offline queue
  - ✅ Offline queue with client UUIDs for idempotency (client_uuid)
  - ✅ Background sync worker (30s interval) flushes to Laravel `/api/sales` endpoint
  - ✅ Read-side cache: product catalog & farmer roster snapshots in IndexedDB
  - ✅ Offline credit-limit flagging: `limit_checked_offline` flag on tender
  - ✅ Real network detection: online/offline events auto-trigger sync
  - ✅ Connectivity pill in header (green/amber/red) with pending count
  - ✅ Sync state tracking: lastSync, isSyncing, syncError
  - ✅ Cache search: `searchCachedProducts`, `searchCachedFarmers` for offline search
- **2.3 Receipt & Peripheral Templates** — `[COMPLETED]`
  - ✅ `Receipt` component with dual rendering: on-screen preview + print-optimized iframe
  - ✅ `@media print` CSS optimized for 58mm/80mm thermal printers
  - ✅ Credit receipts include running balance block (prev balance, this charge, new balance) - INVARIANT
  - ✅ ESC/POS escape hatch: POST to `/api/print/receipt` for direct thermal printing
  - ✅ `StatementOfAccount` component reusing same template system
  - ✅ `ZReport` component for end-of-day reconciliation
  - ✅ Shared utility functions: `buildReceiptLines`, `buildStatementLines`, `buildZReportLines`
  - ✅ Print controls: browser print, ESC/POS direct, copy text, download .txt

### Phase 3: The Input-to-Loan Engine & API Integration
- **3.1 TanStack Query & Typed API** — `[COMPLETED]`
  - ✅ Created `src/lib/queryClient.ts` with QueryClient configuration (staleTime, gcTime, retry, refetch policies)
  - ✅ Created `src/lib/queryClient.ts` with type-safe queryKeys factory for all API endpoints
  - ✅ Created `src/lib/api.ts` with Axios instance, interceptors (auth token, token refresh, 419 CSRF handling)
  - ✅ Created typed API services for all endpoints: auth, shareholders, loans, transactions, products, consignees, dashboard, activityLogs, notifications, reports, backups, users, settings, upload, health
  - ✅ Created `src/hooks/useApi.ts` with 50+ typed React Query hooks (useQuery/useMutation) for all services
  - ✅ End-to-end TypeScript types from `src/types/api.ts` — compile-time safety when Laravel resources change
  - ✅ Automatic cache invalidation on mutations
  - ✅ Query key factory for consistent invalidation patterns
- **3.2 Contract-First Development** — `[COMPLETED]`
  - ✅ Created `React Frontend/CONTRACT_FIRST.md` documenting the contract-first workflow
  - ✅ Created `React Frontend/scripts/generate-types.ts` - TypeScript generation from OpenAPI spec
  - ✅ Created `React Frontend/openapi.json` - Sample OpenAPI 3.0 spec matching Laravel API
  - ✅ Added `generate:types` script to package.json (uses tsx)
  - ✅ Defined contract rules: breaking changes require version bump, deprecation policy
  - ✅ Documented Laravel setup with l5-swagger for OpenAPI generation
  - ✅ CI/CD integration example for automated type generation
  - ✅ Verification checklist for API changes
- **3.3 Error Taxonomy & Credit Override** — `[COMPLETED]`
  - ✅ Created `src/lib/errorHandling.ts` with comprehensive error taxonomy (25+ error codes)
  - ✅ Normalized error handling with `normalizeError()` for Axios errors, network errors, native errors
  - ✅ Centralized Axios interceptor with automatic handling for: token expiry, CSRF mismatch, network errors, offline queue
  - ✅ Offline request queue with localStorage persistence and retry logic
  - ✅ Error display configurations per error code (toast, inline, modal, severity, auto-dismiss)
  - ✅ React hook `useErrorHandler()` for component-level error handling
  - ✅ `CreditOverrideModal` - 4-step wizard: reason → manager auth → processing → success
  - ✅ `ManagerAuthModal` - Reusable manager authorization for void, refund, override actions
  - ✅ `InlineError`, `FieldError`, `ErrorBanner` components for consistent error display
  - ✅ Credit override API integration: `requestCreditOverride()`, `verifyManagerCredentials()`
  - ✅ All components use design system tokens (danger, credit, forest, surface)
- **3.4 Farmer Ledger** — `[COMPLETED]`
  - ✅ Created `src/features/farmers/components/FarmerLedger.tsx` with discriminated union for entry types
  - ✅ Discriminated union: `PurchaseEntry | FeeEntry | RepaymentEntry | AdjustmentEntry | CreditChargeEntry`
  - ✅ Exhaustive rendering enforced by TypeScript - new entry types cause compile errors
  - ✅ Mobile card transform via `DataTable` `mobileCard` render prop (row → labeled card)
  - ✅ Desktop table with sortable columns, type badges, debit/credit/balance columns
  - ✅ Filter by type, date range, search query with real-time filtering
  - ✅ Print template reuse: `StatementOfAccount` component (same system as receipts)
  - ✅ Export to CSV with formatted columns
  - ✅ Period summary cards: opening/closing balance, total debits/credits, net change
  - ✅ Type-specific detail rendering (purchase items, fee types, repayment breakdown, adjustment reasons)
  - ✅ Running balance column with color-coded debit/credit amounts
  - ✅ Created `src/features/farmers/hooks/useFarmerLedger.ts` with data transformation hooks
  - ✅ All components use design system tokens (forest, credit, danger, surface, primary)

### Phase 4: Harvest-Cycle Scheduling, Analytics & Dashboards
- **4.1 Loan Registration Wizard** — `[COMPLETED]`
  - ✅ Created `src/features/loans/components/LoanRegistrationWizard.tsx` - 4-step wizard
  - ✅ Step 1: Farmer Selection with credit limit display and utilization
  - ✅ Step 2: Loan Details (amount, purpose, term, interest rate, co-maker)
  - ✅ Step 3: Supporting Documents with 5 document types (land title, tax declaration, lease, supplier invoice, co-maker attestation)
  - ✅ Step 4: Review with terms agreement
  - ✅ Camera capture support via `CameraUpload` component (rear camera for documents)
  - ✅ Drag-and-drop file upload with preview
  - ✅ Document status tracking: pending → uploading → uploaded → verified/rejected
  - ✅ Credit limit validation with override warning
  - ✅ Monthly payment calculator
  - ✅ Progress stepper with horizontal/vertical orientations
  - ✅ Camera capture modal with rear-facing camera for document scanning
  - ✅ Document verification workflow (uploaded → verified/rejected by manager)
  - ✅ Credit limit eligibility locked until documents verified
  - ✅ Co-maker selection
  - ✅ Estimated monthly payment display
  - ✅ All components use design system tokens (forest, credit, danger, surface, primary)
- **4.2 Collections Calendar** — `[COMPLETED]`
  - ✅ Created `src/features/collections/components/CollectionsCalendar.tsx` - dual view (month grid / agenda)
  - ✅ Month grid view on desktop with collections per day, color-coded by status
  - ✅ Agenda list view on mobile with grouped-by-date cards
  - ✅ Harvest window grouping with summary cards (total due, overdue, paid, pending)
  - ✅ Filter by harvest window, status, risk level, search
  - ✅ Worklist export to CSV
  - ✅ Summary cards: total due, overdue, collected, collection rate
  - ✅ Collection detail modal with payment recording
  - ✅ Month navigation (prev/next/today)
  - ✅ Harvest window cards with top 5 collections preview
  - ✅ Color-coded status badges (pending/paid/overdue/partial)
  - ✅ Risk badges integrated (low/medium/high)
  - ✅ Responsive: month grid on desktop, agenda cards on mobile
  - ✅ Created `src/features/collections/hooks/useCollections.ts` with data fetching hooks
  - ✅ All components use design system tokens (forest, credit, danger, surface, primary)
- **4.3 Risk Badge & Reports** — `[COMPLETED]`
  - ✅ Created `src/features/reports/components/ReportsDashboard.tsx` - comprehensive analytics dashboard
  - ✅ AR Aging buckets (Current, 1-30, 31-60, 61-90, 90+) with bar chart visualization
  - ✅ Sales trend chart (12 months) with cash/credit breakdown using Recharts
  - ✅ Risk distribution pie chart (Low/Medium/High) with color-coded tokens
  - ✅ Top 10 risk farmers table with risk scores, utilization, overdue days, key factors
  - ✅ AR Aging detail table with percentage bars
  - ✅ Sales analytics table with cash/credit split, shrinkage tracking
  - ✅ KPI cards: Total Portfolio, Overdue Amount, Collection Rate, Monthly Sales, High Risk Farmers
  - ✅ Risk badge integration (RiskBadge component) throughout dashboard
  - ✅ Farmer risk profiles with computed risk scores (0-100) and risk factors
  - ✅ Harvest window grouping for collections
  - ✅ Date range selector for report filtering
  - ✅ Export functionality for reports
  - ✅ Created `src/features/reports/hooks/useReports.ts` with data fetching hooks
  - ✅ Recharts visualizations locked to design system tokens (forest, credit, danger, surface, primary)
  - ✅ Responsive design with mobile-friendly tables (card transform)
  - ✅ All components use design system tokens (forest, credit, danger, surface, primary)

### Phase 5: Hardening, Security, and Loop Optimization
- **5.1 Auth & RBAC** — `[COMPLETED]`
  - ✅ Enhanced `src/store/authStore.tsx` with RBAC: roles (clerk, manager, farmer), permissions, and permission checking methods
  - ✅ Created `src/components/ui/ProtectedRoute.tsx` with RBAC-enabled route protection (role-based, permission-based, all/any permissions)
  - ✅ Created `Can` component for conditional rendering based on roles/permissions
  - ✅ Created `usePermissions` hook for easy permission checking in components
  - ✅ Created `src/features/farmer-portal/components/FarmerPortal.tsx` - minimal farmer portal bundle (balance, ledger, due dates)
  - ✅ Updated `src/App.tsx` with RBAC-enabled route structure:
    - `/my-account` - Farmer portal (farmer role only)
    - `/admin/*` - Admin routes (manager role only)
    - `/pos`, `/dashboard`, `/shareholders`, etc. - Clerk/Manager routes
    - `/login` - Public route (redirects authenticated users)
  - ✅ Role-based permissions: clerk (POS access, void/refund with manager auth), manager (full admin + loan management), farmer (read-only portal)
  - ✅ Frontend RBAC is UX only - every gated render corresponds to Laravel policy/middleware check
  - ✅ Farmer portal is separate minimal route bundle (balance, ledger, upcoming due dates) - mobile-first, low-bandwidth, code-split
- **5.2 CORS & Testing** — `[COMPLETED]`
  - ✅ Updated `laravel_backend/config/cors.php` with environment-specific origins (production, LAN, development)
  - ✅ Added CORS environment variables to `.env` (FRONTEND_URL_PRODUCTION, FRONTEND_URL_LAN, FRONTEND_URL_DEV)
  - ✅ Configured allowed origins patterns for localhost and LAN IPs
  - ✅ Set up Vitest configuration with jsdom environment, coverage thresholds (80%), and test setup
  - ✅ Created MSW (Mock Service Worker) handlers for all Laravel API endpoints with realistic mock data
  - ✅ Created comprehensive test setup with MSW server, localStorage/sessionStorage mocks, and global mocks
  - ✅ Created comprehensive unit tests for all UI components (Button, Input, Select, CurrencyInput, Badge, Modal, DataTable, Toast, etc.)
  - ✅ Created tests for hooks (useAuth, useErrorHandler) and utility functions
  - ✅ Created Playwright configuration with multi-browser support (Chromium, Firefox, WebKit) and mobile viewports
  - ✅ Created Playwright golden path tests for POS transaction flows (cash, credit, split, keyboard shortcuts, offline mode)
  - ✅ Created Playwright accessibility tests (WCAG AA, keyboard navigation, ARIA attributes, screen reader support)
  - ✅ Created Playwright responsive layout tests for all 7 viewports (360px to 1920px) across all pages
  - ✅ Added test scripts to package.json: `test`, `test:ui`, `test:run`, `test:coverage`, `test:e2e`, `test:e2e:ui`, `test:e2e:headed`
  - ✅ Added testing dependencies: vitest, @vitest/coverage-v8, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, msw, jsdom, @playwright/test
  - ✅ Configured coverage thresholds (80% for lines, functions, branches, statements)
  - ✅ Created MSW handlers for all API endpoints with realistic mock data and error simulation endpoints
  - ✅ Created test setup with MSW server, localStorage/sessionStorage mocks, fetch mock, and global mocks
- **5.3 Performance & Compliance** — `[COMPLETED]`
  - ✅ Updated `vite.config.ts` with route-level code splitting for POS/admin/farmer bundles
  - ✅ Added `rollup-plugin-visualizer` for bundle analysis with gzip/brotli size reporting
  - ✅ Configured manual chunks for vendor libraries (React, UI, Charts, PDF, Utils) and feature modules
  - ✅ Enabled CSS code splitting, terser minification with console/debugger removal, sourcemaps
  - ✅ Updated `App.tsx` with React.lazy and Suspense for route-level code splitting
  - ✅ Added `WithSuspense` wrapper for consistent loading fallbacks
  - ✅ Created `src/lib/performance/monitoring.ts` with comprehensive performance monitoring:
    - Performance marks/measures for app init, route transitions, chunk loads, API requests
    - PerformanceObserver for long tasks, layout shifts, LCP, FID
    - Bundle size analysis from resource timing
    - Memory usage tracking
    - Debounce/throttle utilities
  - ✅ Created `src/lib/compliance/ra10173.ts` with comprehensive RA 10173 compliance:
    - PII masking for 12 field types (name, email, phone, address, TIN, DOB, biometric, location, IP, etc.)
    - Automatic PII field detection from field names
    - Object-level PII masking with custom maskers
    - Data minimization utility
    - Collection notice in English and Tagalog
    - Export identifier masking
    - PII storage clearing on logout
    - Encryption/decryption for storage (Web Crypto API ready)
    - Audit logging for data access
    - Consent management (record, withdraw, check)
    - Data breach notification framework
    - Retention policy enforcement with automatic cleanup
  - ✅ Created `src/components/ui/PIIMask.tsx` with role-based PII masking components:
    - `PIIMask` - automatic masking based on user role and field type
    - `PIIMaskedTableCell` - DataTable cell wrapper with automatic masking
    - `PIIMaskedText` - simple text component with masking
    - `RoleBasedPII` - conditional rendering based on roles/permissions
    - `FarmerSelfPII` - shows unmasked data only for farmer's own data
    - Tooltip support for authorized roles to view unmasked data
  - ✅ Integrated PII masking into UI component library exports
  - ✅ Route-level code splitting with manual chunks for POS (<200KB gzipped target)
  - ✅ Virtualized tables via DataTable component for large datasets
  - ✅ Memoized selectors for cart/POS state via Zustand
  - ✅ Bundle analysis with rollup-plugin-visualizer (stats.html output)
  - ✅ RA 10173 compliance: role-scoped PII rendering, IndexedDB cleanup on logout, collection notice in loan wizard, masked identifiers in exports

---

Phase 1: Environment, Responsive Architecture & Design System Foundation
1.1 VS Code Workspace & Tooling Setup
Workspace structure — monorepo-style multi-root workspace (agrivet.code-workspace) so Laravel and React live side by side with independent linting:



/agrivet
  /api          → Laravel 11 (PHP 8.x, Sanctum, MySQL 8)
  /web          → React 18 + Vite + TypeScript + Tailwind
Extensions (project-recommended via .vscode/extensions.json):

Extension	Loop role
Tailwind CSS IntelliSense	Enforces token vocabulary at keystroke time — you can't drift from the design system if autocomplete only offers system classes
ES7+ React/Redux snippets	rafce/tsrafce scaffolds keep component skeletons identical across the team
ESLint + Prettier (+ prettier-plugin-tailwindcss)	Auto-sorts Tailwind classes into canonical order — diffs stay reviewable
Error Lens	Inline errors shorten the Build→Verify loop to seconds
PHP Intelephense + Laravel Extra Intellisense	API-side symmetry when touching endpoints
Thunder Client / REST Client	Verify Laravel endpoints without leaving the editor
Vite + dual-server hot loop:

vite.config.ts: React plugin, path aliases (@/components, @/features, @/lib), and a dev proxy — /api → [localhost](http://localhost:8000) — so the browser origin stays single and CORS never interrupts the loop.
One command boots both: concurrently "php artisan serve" "vite" (or Laravel's composer dev script). HMR on the React side; php artisan serve auto-reloads on the API side.
.env.development vs .env.lan — the LAN profile points the API base URL at the local store server (see Phase 2 offline posture), so "works on the shop's LAN" is testable from day one, not discovered at deployment.
Loop check (exit criteria): a fresh clone reaches a hot-reloading screen hitting a live Laravel endpoint in under 10 minutes.

1.2 Responsive Layout & Token Architecture
Mobile-first, token-locked. All design decisions live in tailwind.config.ts — components never use arbitrary values (bg-[#3a5f0b] is a lint failure).

Color tokens for rural agri-commerce:

Token	Value family	Usage
primary (forest green, ~green-700/800)	#166534 scale	Brand, confirm actions, cash tender, paid states
credit (amber)	#d97706 scale	Anything "utang": credit tender buttons, outstanding balances, near-limit warnings
danger (red)	#dc2626 scale	Over-limit, overdue 90+, void/return actions
surface (slate neutrals)	slate-50 → slate-900	Backgrounds, tables, borders, text hierarchy
risk-low / risk-med / risk-high	green / amber / red badges	Farmer credit-risk flags (Phase 4) — defined now so the semantics are consistent everywhere
Semantic aliases (text-balance-due, bg-tender-cash) map onto these so a future re-theme is a one-file change.

Type & spacing: a deliberately large base — text-base = 16px minimum, POS totals at text-3xl/4xl — because counter screens are read at arm's length and farmer phones are often low-DPI. Touch targets ≥ 44px via a min-h-11 convention on all interactive primitives.

Layout grid strategy:

Mobile (default): single column, stacked cards, bottom-sheet modals, sticky bottom action bar.
md: (tablet): two-column dashboards, side-drawer navigation, POS becomes cart-left / actions-bottom.
lg:/xl: (desktop POS): the canonical counter layout — persistent left rail (nav), center transaction grid, right column tender panel. CSS Grid areas (grid-template-areas) per breakpoint rather than reordering DOM, so keyboard tab order stays stable across viewports.
One shared <AppShell> owns all of this; feature screens only fill named slots. No screen defines its own page chrome.
1.3 Atomic Cross-Screen Component Library
Build in strict atomic order — nothing composite until its atoms pass the loop. House them under @/components/ui with a living gallery route (/dev/ui, or Storybook if the team wants isolation) that renders every primitive at all three breakpoints simultaneously — this gallery is the Verify step.

Primitive	Cross-screen behavior spec
Button	Variants: primary, credit, danger, ghost; sizes scale with breakpoint; every variant renders an optional kbd hint (F4) on lg: only
Input / Select / NumberPad	Standard inputs plus a <CurrencyInput> (₱, right-aligned, thousands separators) and an on-screen numpad component for touch tender entry
Modal / Sheet	One component, two presentations: centered dialog on desktop, full-width bottom sheet on mobile. Focus-trapped, Esc closes, returns focus to invoker
DataTable	The workhorse. Desktop: dense sortable columns. Mobile: automatic card transform — each row becomes a labeled card (critical for ledgers and AR aging on phones). Virtualized past ~100 rows
Toast	Top-right desktop, top-center mobile; success/warn/error mapped to tokens; auto-dismiss except error
SearchBar	Debounced, keyboard-navigable result list (↑/↓/Enter), barcode-scanner aware (scanners emit keystrokes + Enter — treat a fast burst ending in Enter as a scan)
Badge / RiskBadge	The Phase-4 risk indicator built now as a dumb primitive so its semantics are settled early
Loop check: every primitive has a spec block (props + keyboard + breakpoint behavior) at the top of its file, renders in the gallery at three widths, and passes a axe-style a11y scan.

Phase 2: Core POS & Keyboard-First Responsive Engine
2.1 Multi-Device POS Layouts
The sub-30-second transaction is the spec. Instrument it: a dev-mode timer from first keystroke to receipt print; any flow change that regresses the median fails Verify.

Desktop (counter terminal, keyboard/scanner-first):

Three-zone grid: product search (top), line-item cart (center, always focused), tender panel (right).
Global keymap via a single useHotkeys hook (no per-component listeners fighting each other):
Key	Action
F2	Focus product search
F4	Open cash tender
F9	Credit charge → farmer account picker
F6	Split payment
+ / −	Qty adjust on selected line
Del	Void line (fires manager-auth modal if configured)
Esc	Cancel / close topmost layer
Scanner input flows into the always-mounted search listener — a scan from anywhere adds the line item without a click.
Tablet: same grid collapses to cart + persistent bottom tender bar; category quick-pick tiles (feeds, meds, seeds, fertilizer) replace typing.

Mobile: clerk fallback / farmer-facing display — stacked flow: search → cart sheet → tender sheet. Every tender button ≥ 56px tall.

All three are one component tree — layout diverges via Tailwind breakpoints and the <AppShell> grid areas, never via forked "mobile POS" code. That's the consistency guarantee.

2.2 Client-Side State & Offline LAN Resilience
Deployment reality from the proposal: LAN-first local server, rural internet unreliable — the POS must keep selling offline. The browser's job is to survive the gaps between it and the LAN server.

Zustand store for the active transaction (cart lines, tender state, selected farmer), with persist middleware → IndexedDB (via idb-keyval), not localStorage — receipts and queued transactions exceed localStorage comfort quickly. A browser crash or accidental refresh mid-sale restores the cart intact.
Outbox pattern for the rare LAN blip: confirmed sales append to a persisted queue with client-generated UUIDs (idempotency keys); a sync worker flushes to Laravel when reachable, and the server dedupes on UUID so a retry never double-posts a ledger entry.
Read-side cache: product catalog and farmer roster snapshots refresh into IndexedDB on each successful sync, so search and credit-limit display keep working during an outage. Hard rule surfaced in UI: credit-limit enforcement against a stale snapshot is flagged — the receipt and ledger entry mark it "limit checked offline," and the sync reconciliation surfaces any breach to the manager (matches the audit-trail posture in the proposal — corrections by reversing entries, never edits).
A persistent connectivity pill in the shell header (green: live · amber: syncing · red: offline, N queued) so clerks always know which mode they're in.
2.3 Receipt & Peripheral Templates
Receipt as a React component (<Receipt>) rendered twice from the same data object: on-screen preview, and a print-optimized version in a hidden iframe with @media print CSS sized to 58mm/80mm thermal widths (configurable), monospaced stack, no color dependency.
Credit receipts always print the running balance block — previous balance, this charge, new balance, next due date (harvest window) — that's the "farmer leaves the counter knowing what they owe" requirement, and it's a template invariant, not an option.
ESC/POS path: browser print via the printer driver is the baseline (works everywhere). Where drag-free printing matters, ship a thin escape hatch: the frontend POSTs the receipt data to a local print endpoint (Laravel on the LAN server drives the ESC/POS printer directly, or a QZ Tray bridge). The React template layer doesn't change either way — only the transport.
Same template system reused later for statements of account and repayment acknowledgments, so all farmer-facing paper shares one visual language.
Phase 3: The Input-to-Loan Engine & API Integration
3.1 API Client & State Synchronization
TanStack Query over bare Axios (Axios remains the transport underneath): caching, retries, and mutation lifecycle map directly onto the outbox/offline model from Phase 2.
Query key convention: ['farmers', id], ['ledger', farmerId], ['inventory', productId] — invalidation after a credit sale touches exactly three keys (farmer balance, ledger, stock) mirroring the proposal's atomic input-to-loan posting on the server.
Error taxonomy in one Axios interceptor, mapped to UI behaviors — never raw toasts of server messages:
409 INSUFFICIENT_STOCK → inline cart-line error with available qty (oversell flagged at the counter, per spec)
422 CREDIT_LIMIT_EXCEEDED → override modal flow (below)
401/419 → session re-auth sheet without losing the in-progress cart
Network fail on a confirmed sale → outbox, not error
Mutations that post ledger entries send the client UUID; the server's ACID transaction (sale + inventory deduction + ledger debit succeed or fail together) is the source of truth — the frontend never optimistically shows a posted ledger entry, only "pending sync."
3.2 Credit Limit Enforcement UI
Selecting a farmer at tender (F9) immediately renders a credit headroom strip: limit, current exposure, this-sale total, projected balance — with the amber token past 80% utilization and red past 100%.
Frontend validation is advisory; the Laravel check is authoritative. The UI blocks the confirm button client-side for speed, but the server response is what actually gates posting.
Manager override modal (same <Modal> primitive → bottom sheet on mobile): requires manager credential entry (re-auth against the API, never a client-side flag), captures an override reason, and the server logs it to the immutable audit trail. On desktop the modal is fully keyboard-operable so the counter flow isn't broken; on tablet it's touch-native automatically.
Risk badge (Phase 4) renders inside this same strip — clerk sees flag + headroom in one glance at the moment of the credit decision, which is exactly where the proposal wants it surfaced.
3.3 Itemized Ledger Component
<FarmerLedger> built on the DataTable primitive: timestamped rows typed as purchase (itemized lines, e.g. "2× Urea 50kg @ ₱1,450"), fee/interest, repayment (full/partial/in-kind at agreed valuation), adjustment/reversal — each type with its own icon and token color, running balance column always last.
Desktop: dense table, sticky header, date-range + type filters. Mobile (farmer portal view): the DataTable's card transform — each entry a card with the running balance prominent, because this is the artifact that ends balance disputes.
Repayments render applied-against context (which maturity they reduced); reversals visibly strike through and link to the reversing entry — the UI mirrors the never-edit-history rule.
Print/export: the ledger feeds the same template system as receipts → printable Statement of Account with store header, farmer identity, period, and closing balance.
Phase 4: Harvest-Cycle Scheduling, Analytics & Dashboards
4.1 Loan Registration — Eligibility & Supporting Documents
(Reading your note as: a farmer can only be registered for a credit line when the claim is supported — land-ownership documents, or invoices/references from a supporting party such as a co-maker or supplier.)

Farmer registration wizard extends the profile spec (identity, farm location, crops, farm size, references) with a supporting-documents step: document type select (land title / tax declaration / lease agreement / supplier invoice / co-maker attestation), file or camera capture (mobile-first — clerks will photograph documents on a phone), and the supporting person's identity + contact when the basis is a third party.
Eligibility gate in the UI: the credit-limit field stays locked until at least one verification document is attached and marked reviewed by a manager role — the farmer can exist as a cash customer immediately, but F9 credit tender refuses unverified accounts with a clear "registration incomplete" state rather than a silent failure.
Document status (pending review / verified / rejected) uses the standard Badge primitive; verified docs are listed read-only on the farmer profile with reviewer + timestamp, feeding the same audit posture as the ledger.
Collections calendar (kept from the base spec): a responsive month/agenda view grouping upcoming maturities by harvest window — wet-season rice (Oct–Nov), dry-season corn — desktop shows a full calendar grid; mobile shows an agenda list of due-date cards. Each window expands into a follow-up worklist (farmer, balance, contact, days to maturity) exportable per the reporting spec.
4.2 Credit Risk Indicators
<RiskBadge> (built in Phase 1) now wired to real data: server-computed score from repayment punctuality, credit-limit utilization, and days past due — the frontend renders, never computes, the score, so clerk and manager views can't disagree.
Surfaced in three places with identical semantics: the farmer picker at F9, the credit headroom strip at tender, and the farmer dashboard. Compact dot+label at the counter (space-constrained), expanded card with the contributing factors on the dashboard.
Color is never the only channel — icon + text label on every badge (low-quality screens, color-blind clerks, thermal-print statements).
4.3 Reporting & Z-Report Modules
Z-Report (end-of-day): expected vs. actual drawer, sales by tender type (cash / credit / split), variance highlighted with danger token; desktop two-column reconciliation, mobile stacked; printable via the receipt template system.
AR aging dashboard: bucket cards — current · 1–30 · 31–60 · 61–90 · 90+ days past maturity — each card drills into the farmer list for that bucket (DataTable → cards on mobile). This is the owner's primary collections tool, so it's the manager home screen.
Sales & inventory analytics: daily/weekly/monthly summaries, top movers, cash-vs-credit mix, near-expiry and shrinkage variance views. Charts via a single wrapped charting component (Recharts) locked to design tokens — responsive container, legend collapses to tap-toggles on mobile.
Seasonal analytics: credit-uptake and demand overlaid on harvest calendars, guiding the owner's pre-planting capital decisions.
Dashboard grid: xl: 3-across widgets, md: 2-across, mobile single column with the AR aging card pinned first.
Phase 5: Hardening, Security, and Loop Optimization
5.1 RBAC & Responsive Route Protection
Roles from the proposal: Store Clerk/Cashier (transactional only), Store Owner/Manager (full admin + loan management), Farmer/Borrower (read-only portal).
Route layer: <ProtectedRoute allow={['manager']}> wrappers on React Router route groups — /pos (clerk+), /admin/* with loan-management tabs (manager), /my-account (farmer portal). Unauthorized navigation redirects with a toast, never a blank screen.
Component layer: a <Can permission="..."> gate for conditional rendering within shared screens — the clerk's POS simply doesn't render void/limit-edit affordances; the manager's POS renders them plus the loan tabs.
Non-negotiable: frontend RBAC is UX, not security — every gated render corresponds to a Laravel policy/middleware check. Verify step includes attempting each forbidden action via direct API call.
Farmer portal is deliberately its own minimal route bundle (balance, ledger, upcoming due dates) — mobile-first, low-bandwidth, code-split so a farmer's phone never downloads the POS engine.
5.2 Testing & Performance Optimization
Testing pyramid, loop-aligned:

Vitest + React Testing Library on every primitive and every money-touching component: currency rounding, running-balance math, credit headroom projection, keymap firing, offline-queue dedupe. The credit-limit override flow and ledger rendering get the densest coverage — they're the trust surface of the whole product.
MSW (Mock Service Worker) to simulate the Laravel API in tests — including 409/422 error paths and network failure, so offline behavior is regression-tested, not hoped for.
Playwright smoke suite for the golden path at all three viewports: scan → credit tender → limit warning → override → receipt → ledger entry visible. This suite is the release gate.
Performance:

Route-level code splitting (POS / admin / farmer portal bundles); rollup-plugin-visualizer budget checks in CI — POS initial bundle target < 200KB gzipped so it boots fast on modest LAN-server-connected terminals.
Virtualized tables for ledgers and aging reports; memoized cart selectors so keystroke-speed line entry never re-renders the tree.
Lighthouse CI thresholds on the farmer portal (the low-end-device surface).
Data privacy (RA 10173) on the frontend:

Purpose-limited display: farmer PII rendered only where the role's task requires it (clerk sees name + balance + risk, not full profile).
No PII in localStorage/IndexedDB beyond the operational cache; cache encrypted-at-rest posture inherited from the LAN server, session storage cleared on logout.
Masked identifiers in exports/screens where full values aren't needed; audit-visible access to farmer financial records; retention and consent copy surfaced in the registration wizard (collection notice at the point of data capture).
Loop optimization (the meta-step): end-of-phase retro folds every Refine finding downstream — recurring layout fixes become tokens, recurring interaction fixes become primitive upgrades — so the system gets more consistent as it grows rather than accreting exceptions.

Sequencing at a Glance
Phase	Duration (indicative)	Exit gate
1	2–3 wks	Gallery of primitives green at 3 breakpoints; dual-server dev loop < 10 min setup
2	3–4 wks	Median mock transaction < 30s; sale survives refresh + LAN blip; thermal receipt with running balance
3	3–4 wks	Credit sale posts atomically; override flow audited; ledger matches server to the centavo
4	3 wks	Registration eligibility gate live; AR aging + Z-report printable; risk badges at counter
5	2–3 wks	RBAC verified at API level; Playwright golden path green ×3 viewports; bundle + privacy audits pass
One assumption worth confirming before Phase 4 build starts: whether document verification (land docs / supporting invoices) is a hard blocker for any credit or only for credit above a threshold — that changes whether the eligibility gate sits on the account or on the limit amount.




README.md

MD

adopt this plan to this.


Adapted Execution Plan — Mapped onto the Lending_PIS Repository
Same five phases, same Spec → Build → Verify → Refine loop — now grounded in your actual repo: laravel_backend/ (Laravel 10+, PHP 8.1+) and React Frontend/ (React 18 + TypeScript + Vite + Tailwind). Below, each phase lists what changes against the original plan and the concrete file-level moves in this codebase.

One structural note before Phase 1: the folder name React Frontend/ contains a space, which will bite you in npm scripts, CI paths, and some tooling. If a rename to react_frontend/ is acceptable now (one git mv + path updates), do it in Phase 1 — it's the cheapest it will ever be. Everything below works either way; paths with the space are quoted.

Phase 1: Environment, Responsive Architecture & Design System Foundation
1.1 Workspace & Tooling — concrete setup
Multi-root workspace file at repo root — Lending_PIS.code-workspace:

jsonc


{
  "folders": [
    { "name": "API (Laravel)", "path": "laravel_backend" },
    { "name": "Web (React)", "path": "React Frontend" }
  ],
  "settings": {
    "tailwindCSS.experimental.classRegex": [["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]],
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  }
}
.vscode/extensions.json (in each folder or root): Tailwind CSS IntelliSense, ES7+ React snippets, ESLint, Prettier + prettier-plugin-tailwindcss, Error Lens, PHP Intelephense, Thunder Client.

TypeScript upgrade to the loop: since this frontend is TS, the "Spec" step of every micro-loop becomes a type contract, not a comment block. Create src/types/ early:

api.ts — response envelopes mirroring Laravel resources (Farmer, LedgerEntry, Sale, Product, CreditCheckResult)
pos.ts — CartLine, TenderState, QueuedTransaction
Enable strict: true in tsconfig.json now; retrofitting strictness onto money-handling code later is misery.
Dev loop wiring — your two-terminal Quick Start becomes one command. Add to React Frontend/package.json:

json


"scripts": {
  "dev": "vite",
  "dev:full": "concurrently -n api,web \"cd ../laravel_backend && php artisan serve\" \"vite\""
}
And in vite.config.ts, proxy to the Laravel port from your README so the browser stays same-origin in dev:

ts


server: {
  proxy: { "/api": "[localhost](http://localhost:8000)" }
}
This removes the CORS friction from the daily loop entirely — CORS config in laravel_backend/config/cors.php then only matters for the deployed split (see Phase 5).

Environment profiles in React Frontend/: .env.development (VITE_API_URL=/api via proxy), .env.lan (VITE_API_URL=[192.168.x.x](http://192.168.x.x:8000/api) for the store-server posture), .env.production.

Loop check: npm run dev:full from a fresh clone → hot-reloading page fetching a live php artisan serve endpoint in under 10 minutes, matching (and tightening) your README's Quick Start.

1.2 Token Architecture
Unchanged in substance — implement in React Frontend/tailwind.config.js (extend, don't replace, whatever Tailwind setup already exists):

primary forest green scale (confirm/cash/paid), credit amber (utang, balances, near-limit), danger red (over-limit, 90+ overdue, voids), surface slate neutrals, risk-low/med/high badge tokens.
Semantic aliases via CSS variables in src/index.css so a re-theme is one file.
Lint rule (eslint-plugin-tailwindcss) forbidding arbitrary values — with TS + IntelliSense this makes token drift a red squiggle, not a review comment.
1.3 Atomic Component Library
Build under React Frontend/src/components/ui/ as typed primitives — each exporting its props interface so consuming features get the contract for free:

Button (with kbdHint prop rendered lg: only) · Input/Select/CurrencyInput/NumberPad · Modal/Sheet (one component, dialog on desktop, bottom sheet on mobile) · DataTable (generic: DataTable<T> with a mobileCard render prop for the card transform) · Toast · SearchBar (scanner-burst aware) · Badge/RiskBadge.

Gallery route at /dev/ui gated to non-production builds — this is the standing Verify surface at 360/768/1280px.

Phase 2: Core POS & Keyboard-First Responsive Engine
Feature code lives in React Frontend/src/features/pos/. Everything from the original plan holds; the repo-specific decisions:

Keymap: one useHotkeys hook in src/lib/hotkeys.ts — F2 search, F4 cash tender, F9 credit charge, F6 split, +/− qty, Del void (manager-auth), Esc cancel. Typed action map so a mis-referenced action is a compile error.
State: Zustand store in src/features/pos/store.ts with persist → IndexedDB (idb-keyval). The QueuedTransaction type carries a client-generated UUID; laravel_backend needs a matching idempotency check (unique constraint on client_uuid in the sales migration — add this to the Laravel migration set now, per your README's php artisan migrate flow).
Deployment-model caveat (this is where your README and the Agrivet spec diverge): the README's deployment section assumes a cloud-hosted API + static frontend on Netlify/Vercel. That works for the farmer portal and owner dashboards, but the POS counter requires the LAN-first posture — a static frontend on Netlify is unreachable when the rural link drops. Resolution: two build targets from the same codebase. The .env.lan build is served by the LAN Laravel box itself (php artisan serve or nginx serving npm run build output from the store server); the .env.production build goes to Netlify/Vercel for remote/cloud users. No code forks — only env and hosting differ.
Receipts: <Receipt> component in src/features/pos/receipt/, print CSS at 58/80mm, running-balance block invariant on credit receipts. ESC/POS escape hatch: a POST /api/print route on the LAN Laravel instance drives the thermal printer server-side — the React template layer is transport-agnostic.
Phase 3: The Input-to-Loan Engine & API Integration
TanStack Query setup in src/lib/queryClient.ts; Axios instance in src/lib/api.ts reading VITE_API_URL. Because this is TS, every query/mutation is typed end-to-end against src/types/api.ts — when a Laravel resource changes shape, the frontend breaks at compile time instead of at the counter.
Contract discipline across the two folders: your README says "develop features in both folders independently" — for ledger-touching endpoints, don't. Adopt a lightweight contract-first step: define the Laravel API Resource + the TS type in the same PR. (If the team wants tooling, generate types from an OpenAPI export of the Laravel routes; otherwise the paired-PR convention is enough.)
Error taxonomy in one Axios interceptor: 409 INSUFFICIENT_STOCK → inline cart-line error; 422 CREDIT_LIMIT_EXCEEDED → override modal; 401/419 (Sanctum session expiry) → re-auth sheet preserving the cart; network failure on confirmed sale → outbox.
Credit headroom strip + manager override modal as previously specced — override re-authenticates against laravel_backend (never a client flag) and the server writes the audit-trail entry.
<FarmerLedger> in src/features/farmers/ on the generic DataTable<LedgerEntry> — typed entry discriminated union (purchase | fee | repayment | adjustment) so rendering each row type exhaustively is compiler-enforced. Card transform for the mobile/farmer view; feeds the same print-template system as receipts for Statements of Account.
Phase 4: Harvest-Cycle Scheduling, Analytics & Dashboards
Structure: src/features/loans/ (registration, eligibility, calendar), src/features/reports/.

Loan registration with supporting documents (land title / tax declaration / lease / supplier invoice / co-maker attestation): wizard with a camera-capture-friendly upload step; documents POST to laravel_backend storage with pending → verified → rejected status. Credit-limit field and F9 eligibility stay locked until a manager marks a document verified — farmer exists as cash customer immediately. (The open question from before stands: hard gate on any credit vs. gate above a threshold — settle before building the enforcement branch.)
Collections calendar: month grid on desktop, agenda cards on mobile, grouped by harvest window; worklist export.
RiskBadge wired to the server-computed score endpoint — rendered at farmer picker, headroom strip, and dashboard; icon + label, never color-only.
Reports: Z-Report reconciliation, AR aging buckets (current / 1–30 / 31–60 / 61–90 / 90+) as the manager home screen, sales & shrinkage analytics via one Recharts wrapper locked to tokens. All printables reuse the template system.
Phase 5: Hardening, Security, and Loop Optimization
Auth & RBAC: Laravel Sanctum (SPA cookie mode fits the same-origin LAN build; token mode for the split cloud deploy). Frontend: <ProtectedRoute> on React Router groups — /pos (clerk+), /admin/* with loan tabs (manager), /my-account (farmer, code-split bundle). <Can permission> gates within shared screens. Every frontend gate mirrors a Laravel policy — Verify includes hitting forbidden endpoints directly with Thunder Client.
CORS, done once: config/cors.php allows exactly the deployed frontend origins (Netlify/Vercel domain + LAN origin); dev never needs it thanks to the Vite proxy.
Testing: Vitest + RTL colocated as *.test.tsx; MSW mocking the Laravel API including 409/422/offline paths; Playwright golden path (scan → credit tender → limit warn → override → receipt → ledger) at three viewports as the release gate. Money math and outbox dedupe get the densest coverage.
Performance: route-split bundles per role surface; POS initial chunk < 200KB gzipped enforced via rollup-plugin-visualizer in CI; virtualized ledgers; Lighthouse CI on the farmer portal.
RA 10173: role-scoped PII rendering, no PII beyond the operational cache in IndexedDB, storage cleared on logout, collection notice in the registration wizard, masked identifiers in exports.