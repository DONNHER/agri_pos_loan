# React Frontend ↔ Laravel Backend API Communication Map

This document maps the React frontend components to the Laravel backend API endpoints for seamless integration.

---

## Base Configuration

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:8000/api` |
| Production | `https://your-domain.com/api` |

**Authentication**: Laravel Sanctum (Bearer Token)
- Login returns `token` → Store in localStorage/cookies
- Include in headers: `Authorization: Bearer {token}`

---

## 1. Authentication & User Management

### Frontend Components
- `LoginView.tsx` - Login/Register/OTP flow
- `OnboardingWizard.tsx` - New member onboarding
- `ProfileView.tsx` - User profile management

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| Login (email/password) | POST | `/api/login` | `AuthController@login` | Returns token + user |
| Login (password only) | POST | `/api/login-password` | `AuthController@loginPassword` | Alternative login |
| Register new member | POST | `/api/register` | `AuthController@register` | Creates user + shareholder |
| Forgot password | POST | `/api/forgot-password` | `AuthController@forgotPassword` | Sends reset email |
| Reset password | POST | `/api/reset-password` | `AuthController@resetPassword` | Resets with token |
| Verify MFA code | POST | `/api/verify-mfa` | `AuthController@verifyMfa` | 2FA verification |
| Resend MFA code | POST | `/api/resend-mfa` | `AuthController@resendMfa` | Resend 2FA |
| Get current user | GET | `/api/user` | Closure | Returns authenticated user + shareholder |
| Update profile | PUT/POST | `/api/user/profile` | `AuthController@updateProfile` | Update name, phone, etc. |
| Change password | PUT/POST | `/api/user/change-password` | `AuthController@changePassword` | Change password |
| Logout | POST | `/api/logout` | `AuthController@logout` | Revoke token |
| User lookup by email | GET | `/api/user/by-email?email=` | Closure | Public lookup for admin/cashier/shareholder |

### Data Models (Frontend ↔ Backend)

**PlatformUser (Frontend)** ↔ **User + Shareholder (Backend)**
```typescript
// Frontend: PlatformUser
{
  id: string,
  role: UserRole,           // SHAREHOLDER | MANAGER | ADMIN | CASHIER
  status: 'ACTIVE' | 'SUSPENDED',
  fullName: string,
  handle: string,
  phone: string,
  email: string,
  accountId: string,        // SH-XXXX-YYYY
  avatarPath: string,
  kycVerified: boolean,
  onboardingCompleted: boolean,
  statementDay: 15 | 30,
  securityPin: string,
  autoDebitEnabled: boolean,
  totalLimit: number,       // Credit limit
  shareCapital: number,     // Share capital
  nationalId: string,
  cityAddress: string,
  incomeSource: string,
  monthlyIncome: number,
  channels: LinkedChannel[], // Payout channels (GCash, Maya, etc.)
  boostTasks: LimitBoostTask[],
  departmentOrBranch?: string
}

// Backend: User + Shareholder (joined)
{
  id, username, email, firstname, lastname, role, status,
  shareholder: { id, user_id, first_name, last_name, email, contact_number, 
                 address, total_share_capital, creditscore, status }
}
```

---

## 2. Shareholder Management

### Frontend Components
- `AdminUsersView.tsx` - Admin user management
- `ShareholderProfileView.tsx` - Shareholder profile
- `HomeView.tsx` - Shareholder dashboard

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List shareholders | GET | `/api/shareholders` | `ShareholderController@index` | Paginated, searchable |
| Get shareholder count | GET | `/api/shareholders/count` | `ShareholderController@count` | Total count |
| Get by user ID | GET | `/api/shareholders/user/{userId}` | `ShareholderController@showByUserId` | Lookup by user |
| Get by email | GET | `/api/shareholders/email/{email}` | `ShareholderController@showByEmail` | Lookup by email |
| Get single | GET | `/api/shareholders/{id}` | `ShareholderController@show` | Full details + audit |
| Create shareholder | POST | `/api/shareholders` | `ShareholderController@store` | Admin creates |
| Update shareholder | PUT/POST | `/api/shareholders/{id}` | `ShareholderController@update` | Update details |
| Update capital | PUT/POST | `/api/shareholders/{id}/capital` | `ShareholderController@updateCapital` | Adjust share capital |
| Delete shareholder | DELETE | `/api/shareholders/{id}` | `ShareholderController@destroy` | Soft delete |

---

## 3. Loan Management

### Frontend Components
- `CashLoanView.tsx` - Shareholder loan request
- `AdminLoansView.tsx` - Admin loan management
- `ManagerApprovalsView.tsx` - Manager loan approval queue
- `HomeView.tsx` - Shows pending/active loans
- `BillsView.tsx` - Repayment schedule & payments

### Backend API Endpoints

#### Loan Requests (Applications)
| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List requests | GET | `/api/loan-requests` | `LoanController@indexRequests` | Paginated, filterable |
| Get count | GET | `/api/loan-requests/count` | `LoanController@countRequests` | Pending count |
| Get single | GET | `/api/loan-requests/{id}` | `LoanController@showRequest` | Full details |
| Create request | POST | `/api/loan-requests` | `LoanController@storeRequest` | Shareholder applies |
| Update status | PUT/POST | `/api/loan-requests/{id}/status` | `LoanController@updateRequestStatus` | Admin/Manager updates |
| Comaker decision | POST | `/api/loan-requests/{id}/comaker-decision` | `LoanController@setComakerDecision` | Co-maker approval |
| Disburse loan | POST | `/api/loan-requests/{id}/disburse` | `LoanController@disburse` | Release funds |

#### Loans (Approved & Active)
| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List loans | GET | `/api/loans` | `LoanController@index` | All loans |
| Get by request | GET | `/api/loans/by-request/{requestId}` | `LoanController@showByRequest` | Loan from request |
| Get single | GET | `/api/loans/{id}` | `LoanController@show` | Full loan details |
| Get payments | GET | `/api/loans/{id}/payments` | `LoanController@getPayments` | Repayment history |
| Record payment | POST | `/api/loans/{id}/payments` | `LoanController@recordPayment` | Add payment |
| By shareholder | GET | `/api/shareholders/{shareholderId}/loans` | `LoanController@getByShareholder` | Member's loans |

#### Loan Settings
| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| Get interest rate | GET | `/api/settings/interest-rate` | `LoanController@getInterestRate` | Current rate |
| Update interest rate | POST | `/api/settings/interest-rate` | `LoanController@updateInterestRate` | Admin updates |
| Rate history | GET | `/api/settings/interest-rate/history` | `LoanController@getInterestRateHistory` | Historical rates |
| Get metrics | GET | `/api/lending/metrics` | `LoanController@getMetrics` | Portfolio metrics |
| Total disbursed | GET | `/api/stats/total-disbursed` | `LoanController@getTotalDisbursed` | Sum disbursed |
| Total capital | GET | `/api/stats/total-capital` | `LoanController@getTotalCapital` | Share capital |
| Active loans count | GET | `/api/stats/active-loans-count` | `LoanController@getActiveLoansCount` | Count active |

### Data Models

**LoanRequestItem (Frontend)** ↔ **LoanRequest (Backend)**
```typescript
// Frontend
{
  id: string,
  referenceCode: string,      // LR-XXXXXX
  userId: string,
  applicantName: string,
  applicantHandle: string,
  nationalId: string,
  applicantProfile: string,
  shareCapitalSnapshot: number,
  type: PlanType.CASH_LOAN,
  purpose: string,
  principal: number,
  tenor: TenorMonths,         // 1 | 3 | 6 | 9 | 12
  monthlyRatePct: number,
  monthlyInstallment: number,
  totalRepayment: number,
  disbursementChannel: string,
  status: LoanRequestStatus,  // PENDING | APPROVED | REJECTED
  createdAt: string,
  reviewedBy?: string,
  reviewedAt?: string,
  reviewNote?: string,
  checklist?: { kycVerified, shareCapitalChecked, repaymentCapacityChecked }
}

// Backend: LoanRequest model
```

**CreditPlan (Frontend)** ↔ **Loan (Backend)**
```typescript
// Frontend
{
  id: string,
  userId: string,
  referenceCode: string,      // LN-XXXXXX
  title: string,
  type: PlanType.CASH_LOAN,
  createdAt: string,
  principal: number,
  monthlyRatePct: number,
  tenor: TenorMonths,
  disbursedToOrMerchant: string,
  installments: InstallmentItem[]  // Each with dueDate, principalPart, interestPart, totalDue, status
}

// Backend: Loan model with installments
```

---

## 4. Transaction Management

### Frontend Components
- `BillsView.tsx` - Transaction ledger (history tab)
- `HomeView.tsx` - Recent transactions
- `AdminReportsView.tsx` - Export transactions

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List transactions | GET | `/api/transactions` | `TransactionController@index` | Paginated, filterable |
| Get count | GET | `/api/transactions/count` | `TransactionController@count` | Total count |
| By shareholder | GET | `/api/transactions/shareholder/{shareholderId}` | `TransactionController@getByShareholder` | Member's transactions |
| By reference | GET | `/api/transactions/reference/{referenceId}` | `TransactionController@getByReference` | Loan-linked transactions |
| Create transaction | POST | `/api/transactions` | `TransactionController@store` | Record payment/disbursement |

### Data Models

**LedgerEntry (Frontend)** ↔ **Transaction (Backend)**
```typescript
// Frontend
{
  id: string,
  userId: string,
  referenceCode: string,
  title: string,
  subtitle: string,
  timestamp: string,
  amount: number,
  direction: 'INFLOW' | 'OUTFLOW' | 'REPAYMENT',
  channel: string,
  planType: PlanType
}

// Backend: Transaction model
```

---

## 5. Dashboard & Analytics

### Frontend Components
- `HomeView.tsx` - Shareholder dashboard
- `ManagerOverviewView.tsx` - Manager dashboard
- `AdminReportsView.tsx` - Admin analytics
- `AdminLogsBackupsView.tsx` - System logs

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| Dashboard stats | GET | `/api/dashboard/stats` | `DashboardController@getStats` | Comprehensive stats |
| Loan chart | GET | `/api/dashboard/charts/loans` | `DashboardController@getLoanChart` | Loan volume over time |
| Share capital chart | GET | `/api/dashboard/charts/share-capital` | `DashboardController@getShareCapitalChart` | Capital growth |
| Recent loans | GET | `/api/dashboard/recent/loans` | `DashboardController@getRecentLoans` | Latest loans |
| Recent transactions | GET | `/api/dashboard/recent/transactions` | `DashboardController@getRecentTransactions` | Latest transactions |
| Top shareholders | GET | `/api/dashboard/top-shareholders` | `DashboardController@getTopShareholders` | By capital/loans |

---

## 6. Notifications

### Frontend Components
- `NotificationDropdown.tsx` - Unified notification feed
- `ProfileView.tsx` - Notification settings

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List notifications | GET | `/api/notifications` | `NotificationController@index` | For shareholder |
| Mark as read | PUT/POST | `/api/notifications/{id}/mark-as-read` | `NotificationController@markAsRead` | Single |
| Mark all read | PUT/POST | `/api/notifications/mark-all-read` | `NotificationController@markAllAsRead` | Bulk |
| Delete all | DELETE | `/api/notifications` | `NotificationController@destroyAll` | Clear all |
| Send email | POST | `/api/send-email` | `NotificationController@sendEmail` | Admin sends email |

### Data Models

**NotificationItem (Frontend)** ↔ **Notification (Backend)**
```typescript
// Frontend
{
  id: string,
  userId: string,
  category: 'LOAN' | 'PAYMENT' | 'TICKET' | 'ACCOUNT' | 'APPROVAL',
  title: string,
  message: string,
  timestamp: string,
  read: boolean,
  referenceCode?: string
}

// Backend: Notification model
```

---

## 7. Activity Logs & Audit Trail

### Frontend Components
- `AdminLogsBackupsView.tsx` - Admin logs view
- Profile views - User audit trail

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List logs | GET | `/api/activity-logs` | `ActivityLogController@index` | Filterable, paginated |
| Get count | GET | `/api/activity-logs/count` | `ActivityLogController@count` | Total count |
| Create log | POST | `/api/activity-logs` | `ActivityLogController@store` | Record activity |
| Export logs | GET | `/api/activity-logs/export` | `ActivityLogController@export` | CSV download |
| Cleanup old | POST | `/api/activity-logs/cleanup` | `ActivityLogController@cleanup` | Delete >90 days |

### Data Models

**AuditLogEntry (Frontend)** ↔ **ActivityLog (Backend)**
```typescript
// Frontend
{
  id: string,
  timestamp: string,
  category: AuditCategory,  // AUTH | IMPERSONATION | ONBOARDING | LOAN | PAYMENT | TICKET | USER_MGMT | BACKUP
  actorName: string,
  actorHandle: string,
  actorRole: UserRole,
  impersonatedBy?: string,
  action: string,
  target: string,
  details: string
}

// Backend: ActivityLog model
```

---

## 8. File Upload

### Frontend Components
- `OnboardingWizard.tsx` - Avatar upload
- `ProfileView.tsx` - Profile image
- `AdminUsersView.tsx` - User avatars

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| Upload file | POST | `/api/upload` | `FileUploadController@upload` | Image upload (max 5MB, jpeg/png/gif) |

---

## 9. Import/Export

### Frontend Components
- `AdminReportsView.tsx` - Export CSV
- `AdminLogsBackupsView.tsx` - Import/Export JSON backups
- `AdminUsersView.tsx` - Bulk operations

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| Export data | GET | `/api/export/{type}/{format}` | `ImportExportController@export` | types: transactions, users, loans, activity-logs; formats: xlsx, csv, pdf |
| Preview import | POST | `/api/import/{type}/preview` | `ImportExportController@previewImport` | Dry run validation |
| Confirm import | POST | `/api/import/{type}/confirm` | `ImportExportController@confirmImport` | Actual import |
| Download errors | POST | `/api/import/error-report` | `ImportExportController@downloadErrorReport` | Error report |

---

## 10. Backup & Disaster Recovery

### Frontend Components
- `AdminLogsBackupsView.tsx` - Backup management
- `PosBackupsView.tsx` - POS backups

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List backups | GET | `/api/backups` | `BackupController@listBackups` | All backup files |
| Get settings | GET | `/api/backups/settings` | `BackupController@getSettings` | Backup config |
| Update settings | PUT | `/api/backups/settings` | `BackupController@updateSettings` | Update config |
| Run manual backup | POST | `/api/backups/run` | `BackupController@runManualBackup` | Trigger backup |

---

## 11. Admin User Management

### Frontend Components
- `AdminUsersView.tsx` - Full user CRUD
- `AdminProfileView.tsx` - Admin profile

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List users | GET | `/api/admin/users` | `UserController@index` | Paginated, searchable |
| Get count | GET | `/api/admin/users/count` | `UserController@count` | Filtered count |
| Get single | GET | `/api/admin/users/{id}` | `UserController@show` | With audit trail |
| Create user | POST | `/api/admin/users` | `UserController@store` | Admin creates |
| Update user | PUT | `/api/admin/users/{id}` | `UserController@update` | Update details |
| Delete user | DELETE | `/api/admin/users/{id}` | `UserController@destroy` | Soft delete |
| Bulk delete | POST | `/api/admin/bulk-delete-users` | `UserController@bulkDelete` | Multiple delete |
| Login history | GET | `/api/admin/users/{id}/login-history` | `UserController@loginHistory` | Auth logs |
| Impersonate | POST | `/api/admin/users/{id}/impersonate` | `UserController@impersonate` | Admin impersonation |
| Update status | PUT/POST | `/api/admin/users/{id}/status` | `UserController@updateStatus` | Active/Suspended |
| Update address | PUT/POST | `/api/admin/users/{id}/address` | `UserController@updateAddress` | Address sync |

---

## 12. POS (Point of Sale) Module

### Frontend Components
- `PosApp.tsx` - Main POS app
- `PosCheckoutView.tsx` - Sales register
- `PosInventoryView.tsx` - Inventory management
- `PosReportsView.tsx` - Sales reports
- `PosBackupsView.tsx` - POS backups

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| Offline login | POST | `/api/pos/offline-login` | `PosController@offlineLogin` | POS terminal auth |
| Get catalog | GET | `/api/pos/catalog` | `PosController@catalog` | Products + shareholders |
| Record sale | POST | `/api/pos/sales` | `PosController@storeSale` | Save transaction |
| Sync offline | POST | `/api/pos/sync` | `PosController@sync` | Offline → online |
| POS status | GET | `/api/pos/status` | `PosController@status` | Sync status |
| POS logout | POST | `/api/pos/logout` | `AuthController@logout` | End session |

---

## 13. Products & Inventory

### Frontend Components
- `PosInventoryView.tsx` - Product management
- `PosCheckoutView.tsx` - Product selection

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List products | GET | `/api/products` | `ProductController@index` | Paginated, searchable |
| Create product | POST | `/api/products` | `ProductController@store` | Add product |
| Get product | GET | `/api/products/{id}` | `ProductController@show` | With audit trail |
| Update product | PUT | `/api/products/{id}` | `ProductController@update` | Optimistic locking |
| Delete product | DELETE | `/api/products/{id}` | `ProductController@destroy` | Soft delete |
| Restore product | POST | `/api/products/{id}/restore` | `ProductController@restore` | Restore |
| Bulk actions | POST | `/api/products/bulk-action` | `ProductController@bulkAction` | Delete/restore/export |
| Get batches | GET | `/api/products/{id}/batches` | `ProductController@getBatches` | Stock batches |

---

## 14. Consignees (Partners)

### Frontend Components
- Not yet implemented in frontend

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| List consignees | GET | `/api/consignees` | `ConsigneeController@index` | Paginated, searchable |
| Search | GET | `/api/consignees/search` | `ConsigneeController@search` | Fast lookup |
| Create | POST | `/api/consignees` | `ConsigneeController@store` | Add partner |
| Get single | GET | `/api/consignees/{id}` | `ConsigneeController@show` | With audit |
| Update | PUT | `/api/consignees/{id}` | `ConsigneeController@update` | Optimistic locking |
| Delete | DELETE | `/api/consignees/{id}` | `ConsigneeController@destroy` | Soft delete |
| Restore | POST | `/api/consignees/{id}/restore` | `ConsigneeController@restore` | Restore |
| Bulk actions | POST | `/api/consignees/bulk-action` | `ConsigneeController@bulkAction` | Delete/restore/export |
| Export | GET | `/api/consignees/export` | `ConsigneeController@export` | CSV |

---

## 15. Reports

### Frontend Components
- `AdminReportsView.tsx` - Report generation
- `PosReportsView.tsx` - POS sales reports

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| Available reports | GET | `/api/reports` | `ReportsController@index` | List report types |
| Generate report | POST | `/api/reports/generate` | `ReportsController@generate` | Create report |
| Download report | GET | `/api/reports/download/{filename}` | `ReportsController@download` | Get file |
| List preferences | GET | `/api/reports/preferences` | `ReportsController@listPreferences` | Saved configs |
| Save preference | POST | `/api/reports/preferences` | `ReportsController@savePreference` | Save config |
| Schedule email | POST | `/api/reports/schedule` | `ReportsController@schedule` | Email report |

---

## 16. Database Status

### Frontend Components
- Not yet implemented

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Controller | Description |
|-----------------|-------------|----------|------------|-------------|
| Database status | GET | `/api/database-status` | `DatabaseStatusController` | Connection health |

---

## 17. Health Check

### Backend API Endpoints

| Frontend Action | HTTP Method | Endpoint | Description |
|-----------------|-------------|----------|-------------|
| Health check | GET | `/api/health` | Returns `{ status: 'ok' }` |

---

## Integration Checklist

### Frontend → Backend Mapping Status

| Frontend Module | Backend API Coverage | Status |
|-----------------|---------------------|--------|
| Authentication | ✅ Complete | Ready |
| Shareholder Management | ✅ Complete | Ready |
| Loan Requests | ✅ Complete | Ready |
| Loan Management | ✅ Complete | Ready |
| Transactions | ✅ Complete | Ready |
| Dashboard/Analytics | ✅ Complete | Ready |
| Notifications | ✅ Complete | Ready |
| Activity Logs | ✅ Complete | Ready |
| File Upload | ✅ Complete | Ready |
| Import/Export | ✅ Complete | Ready |
| Backup/Recovery | ✅ Complete | Ready |
| Admin Users | ✅ Complete | Ready |
| POS Module | ✅ Complete | Ready |
| Products | ✅ Complete | Ready |
| Consignees | ⚠️ Backend only | Need frontend |
| Reports | ✅ Complete | Ready |

### Required Frontend Changes for Integration

1. **Create API Service Layer** (`frontend/loan/shared/api.ts`)
   - Axios instance with baseURL, interceptors for auth
   - Type-safe API functions for each endpoint

2. **Replace Local State with API Calls**
   - `App.tsx` - Replace `localStorage` with API calls
   - `ShareholderWorkspace.tsx` - Connect to real endpoints
   - `ManagerWorkspace.tsx` - Connect to real endpoints
   - `AdminWorkspace.tsx` - Connect to real endpoints
   - `PosWorkspace.tsx` - Connect to POS endpoints

3. **Authentication Flow**
   - Store token in httpOnly cookie or localStorage
   - Auto-refresh token logic
   - Redirect to login on 401

4. **Error Handling**
   - Global error boundary
   - Toast notifications for API errors
   - Retry logic for failed requests

5. **Loading States**
   - Skeleton loaders for data fetching
   - Optimistic updates for mutations

---

## Example API Service Structure

```typescript
// frontend/loan/shared/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/login', { email, password }),
  register: (data: RegisterPayload) => api.post('/register', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
  updateProfile: (data: Partial<PlatformUser>) => api.put('/user/profile', data),
  changePassword: (data: { current: string; new: string }) => api.put('/user/change-password', data),
};

// Shareholders
export const shareholderApi = {
  list: (params?: ListParams) => api.get('/shareholders', { params }),
  get: (id: string) => api.get(`/shareholders/${id}`),
  create: (data: ShareholderPayload) => api.post('/shareholders', data),
  update: (id: string, data: Partial<ShareholderPayload>) => api.put(`/shareholders/${id}`, data),
  updateCapital: (id: string, capital: number) => api.put(`/shareholders/${id}/capital`, { capital }),
  delete: (id: string) => api.delete(`/shareholders/${id}`),
};

// Loans
export const loanApi = {
  // Requests
  listRequests: (params?: ListParams) => api.get('/loan-requests', { params }),
  getRequest: (id: string) => api.get(`/loan-requests/${id}`),
  createRequest: (data: LoanRequestPayload) => api.post('/loan-requests', data),
  updateRequestStatus: (id: string, status: LoanRequestStatus) => api.put(`/loan-requests/${id}/status`, { status }),
  disburse: (id: string) => api.post(`/loan-requests/${id}/disburse`),
  
  // Loans
  list: (params?: ListParams) => api.get('/loans', { params }),
  get: (id: string) => api.get(`/loans/${id}`),
  getPayments: (id: string) => api.get(`/loans/${id}/payments`),
  recordPayment: (id: string, data: PaymentPayload) => api.post(`/loans/${id}/payments`, data),
  byShareholder: (shareholderId: string) => api.get(`/shareholders/${shareholderId}/loans`),
  
  // Settings
  getInterestRate: () => api.get('/settings/interest-rate'),
  updateInterestRate: (rate: number) => api.post('/settings/interest-rate', { rate }),
  getMetrics: () => api.get('/lending/metrics'),
};

// ... continue for all modules
```

---

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=TikCredit
```

### Backend (.env)
```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
```

---

## CORS Configuration (Backend)

```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

---

## Testing Checklist

- [ ] Login/Register flow works end-to-end
- [ ] Token persists across page refreshes
- [ ] Shareholder can request loan → Manager approves → Funds disbursed
- [ ] Repayments recorded and reflected in ledger
- [ ] Dashboard stats match database
- [ ] Notifications appear in real-time
- [ ] Admin can manage users/loans/products
- [ ] POS offline/online sync works
- [ ] Import/Export functions correctly
- [ ] Backup creation/restore works
- [ ] File uploads work (avatars, documents)
- [ ] Audit logs capture all actions
- [ ] Role-based access control enforced
- [ ] Error handling shows user-friendly messages
- [ ] Loading states during API calls