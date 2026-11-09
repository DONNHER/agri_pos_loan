import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  PlatformUser,
  PlatformState,
  LoanRequestItem,
  CreditPlan,
  InstallmentItem,
  LedgerEntry,
  SupportTicketItem,
  NotificationItem,
  AuditLogEntry,
  BackupSnapshot,
  LinkedChannel,
  LimitBoostTask,
  UserRole,
  PlanType,
  LoanRequestStatus,
  InstallmentStatus,
  TicketStatus,
  NotificationCategory,
  TenorMonths,
} from '../creditData';

// ============================================
// Types for API Requests/Responses
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  handle: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoanRequestPayload {
  amount: number;
  tenor: TenorMonths;
  channelId: string;
  purpose: string;
}

export interface PaymentPayload {
  amount: number;
  channel: string;
  referenceId?: string;
}

export interface ShareholderPayload {
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  address: string;
  total_share_capital: number;
  user_id?: string;
}

export interface UserPayload {
  username: string;
  email: string;
  password?: string;
  firstname: string;
  lastname: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  mfa_enabled?: boolean;
}

export interface ProductPayload {
  name: string;
  category: string;
  selling_price: number;
  unit: string;
  cost_price?: number;
  description?: string;
  barcode?: string;
  product_image?: string;
  min_threshold?: number;
  can_break_down?: boolean;
  breakdown_into_unit?: string;
  breakdown_ratio?: number;
}

export interface TransactionPayload {
  shareholder_id: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  reference_id?: string;
  date?: string;
}

export interface NotificationPayload {
  shareholder_id: string;
  user_id?: string;
  title: string;
  content: string;
  category: string;
  type: string;
  is_unread?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  [key: string]: unknown;
}

// ============================================
// Axios Instance Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true, // For Sanctum cookie-based auth
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Transform error response
        const apiError = this.transformError(error);
        return Promise.reject(apiError);
      }
    );
  }

  private transformError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as ApiResponse<unknown>;
      return {
        status: error.response.status,
        message: data.message || error.message,
        errors: data.errors,
        data: data.data,
      };
    }
    return {
      status: 0,
      message: error.message || 'Network error',
      errors: undefined,
      data: undefined,
    };
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/refresh`, {}, { withCredentials: true });
        const token = response.data.token || response.data.access_token;
        this.setAccessToken(token);
        return token;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  // Token management
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  private clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  // ============================================
  // Auth API
  // ============================================

  async login(credentials: LoginCredentials): Promise<{ user: PlatformUser; token: string }> {
    const response = await this.client.post<ApiResponse<{ user: PlatformUser; token: string }>>('/login', credentials);
    const { user, token } = response.data.data!;
    this.setAccessToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, token };
  }

  async loginPassword(credentials: LoginCredentials): Promise<{ user: PlatformUser; token: string }> {
    const response = await this.client.post<ApiResponse<{ user: PlatformUser; token: string }>>('/login-password', credentials);
    const { user, token } = response.data.data!;
    this.setAccessToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, token };
  }

  async register(data: RegisterPayload): Promise<{ user: PlatformUser; token: string }> {
    const response = await this.client.post<ApiResponse<{ user: PlatformUser; token: string }>>('/register', data);
    const { user, token } = response.data.data!;
    this.setAccessToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, token };
  }

  async logout(): Promise<void> {
    await this.client.post('/logout');
    this.clearAuth();
  }

  async getCurrentUser(): Promise<PlatformUser> {
    const response = await this.client.get<ApiResponse<PlatformUser>>('/user');
    const user = response.data.data!;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async updateProfile(data: Partial<PlatformUser>): Promise<PlatformUser> {
    const response = await this.client.put<ApiResponse<PlatformUser>>('/user/profile', data);
    const user = response.data.data!;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async changePassword(current: string, newPassword: string): Promise<void> {
    await this.client.put('/user/change-password', { current_password: current, password: newPassword, password_confirmation: newPassword });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.client.post('/forgot-password', { email });
  }

  async resetPassword(token: string, email: string, password: string, password_confirmation: string): Promise<void> {
    await this.client.post('/reset-password', { token, email, password, password_confirmation });
  }

  async verifyMfa(code: string): Promise<void> {
    await this.client.post('/verify-mfa', { code });
  }

  async resendMfa(): Promise<void> {
    await this.client.post('/resend-mfa');
  }

  async offlineLogin(data: { email: string; pin: string }): Promise<{ user: PlatformUser; token: string }> {
    const response = await this.client.post<ApiResponse<{ user: PlatformUser; token: string }>>('/pos/offline-login', data);
    const { user, token } = response.data.data!;
    this.setAccessToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, token };
  }

  // ============================================
  // Shareholders API
  // ============================================

  async getShareholders(params?: ListParams): Promise<PaginatedResponse<PlatformUser>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<PlatformUser>>>('/shareholders', { params });
    return response.data.data!;
  }

  async getShareholderCount(): Promise<number> {
    const response = await this.client.get<ApiResponse<{ count: number }>>('/shareholders/count');
    return response.data.data!.count;
  }

  async getShareholderByUserId(userId: string): Promise<PlatformUser> {
    const response = await this.client.get<ApiResponse<PlatformUser>>(`/shareholders/user/${userId}`);
    return response.data.data!;
  }

  async getShareholderByEmail(email: string): Promise<PlatformUser> {
    const response = await this.client.get<ApiResponse<PlatformUser>>(`/shareholders/email/${email}`);
    return response.data.data!;
  }

  async getShareholder(id: string): Promise<PlatformUser> {
    const response = await this.client.get<ApiResponse<PlatformUser>>(`/shareholders/${id}`);
    return response.data.data!;
  }

  async createShareholder(data: ShareholderPayload): Promise<PlatformUser> {
    const response = await this.client.post<ApiResponse<PlatformUser>>('/shareholders', data);
    return response.data.data!;
  }

  async updateShareholder(id: string, data: Partial<ShareholderPayload>): Promise<PlatformUser> {
    const response = await this.client.put<ApiResponse<PlatformUser>>(`/shareholders/${id}`, data);
    return response.data.data!;
  }

  async updateShareholderCapital(id: string, capital: number): Promise<PlatformUser> {
    const response = await this.client.put<ApiResponse<PlatformUser>>(`/shareholders/${id}/capital`, { total_share_capital: capital });
    return response.data.data!;
  }

  async deleteShareholder(id: string): Promise<void> {
    await this.client.delete(`/shareholders/${id}`);
  }

  // ============================================
  // Loan Requests API
  // ============================================

  async getLoanRequests(params?: ListParams): Promise<PaginatedResponse<LoanRequestItem>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<LoanRequestItem>>>('/loan-requests', { params });
    return response.data.data!;
  }

  async getLoanRequestCount(): Promise<number> {
    const response = await this.client.get<ApiResponse<{ count: number }>>('/loan-requests/count');
    return response.data.data!.count;
  }

  async getLoanRequest(id: string): Promise<LoanRequestItem> {
    const response = await this.client.get<ApiResponse<LoanRequestItem>>(`/loan-requests/${id}`);
    return response.data.data!;
  }

  async createLoanRequest(data: LoanRequestPayload): Promise<LoanRequestItem> {
    const response = await this.client.post<ApiResponse<LoanRequestItem>>('/loan-requests', data);
    return response.data.data!;
  }

  async updateLoanRequestStatus(id: string, status: LoanRequestStatus, reviewNote?: string): Promise<LoanRequestItem> {
    const response = await this.client.put<ApiResponse<LoanRequestItem>>(`/loan-requests/${id}/status`, { status, review_note: reviewNote });
    return response.data.data!;
  }

  async setComakerDecision(id: string, decision: 'approved' | 'rejected', note?: string): Promise<LoanRequestItem> {
    const response = await this.client.post<ApiResponse<LoanRequestItem>>(`/loan-requests/${id}/comaker-decision`, { decision, note });
    return response.data.data!;
  }

  async disburseLoan(id: string): Promise<LoanRequestItem> {
    const response = await this.client.post<ApiResponse<LoanRequestItem>>(`/loan-requests/${id}/disburse`);
    return response.data.data!;
  }

  // ============================================
  // Loans API
  // ============================================

  async getLoans(params?: ListParams): Promise<PaginatedResponse<CreditPlan>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<CreditPlan>>>('/loans', { params });
    return response.data.data!;
  }

  async getLoanByRequest(requestId: string): Promise<CreditPlan> {
    const response = await this.client.get<ApiResponse<CreditPlan>>(`/loans/by-request/${requestId}`);
    return response.data.data!;
  }

  async getLoan(id: string): Promise<CreditPlan> {
    const response = await this.client.get<ApiResponse<CreditPlan>>(`/loans/${id}`);
    return response.data.data!;
  }

  async getLoanPayments(loanId: string): Promise<InstallmentItem[]> {
    const response = await this.client.get<ApiResponse<InstallmentItem[]>>(`/loans/${loanId}/payments`);
    return response.data.data!;
  }

  async recordLoanPayment(loanId: string, data: PaymentPayload): Promise<InstallmentItem> {
    const response = await this.client.post<ApiResponse<InstallmentItem>>(`/loans/${loanId}/payments`, data);
    return response.data.data!;
  }

  async getLoansByShareholder(shareholderId: string): Promise<CreditPlan[]> {
    const response = await this.client.get<ApiResponse<CreditPlan[]>>(`/shareholders/${shareholderId}/loans`);
    return response.data.data!;
  }

  // ============================================
  // Loan Settings API
  // ============================================

  async getInterestRate(): Promise<{ rate: number; effective_date: string }> {
    const response = await this.client.get<ApiResponse<{ rate: number; effective_date: string }>>('/settings/interest-rate');
    return response.data.data!;
  }

  async updateInterestRate(rate: number): Promise<{ rate: number; effective_date: string }> {
    const response = await this.client.post<ApiResponse<{ rate: number; effective_date: string }>>('/settings/interest-rate', { rate });
    return response.data.data!;
  }

  async getInterestRateHistory(): Promise<Array<{ rate: number; effective_date: string; changed_by: string }>> {
    const response = await this.client.get<ApiResponse<Array<{ rate: number; effective_date: string; changed_by: string }>>>('/settings/interest-rate/history');
    return response.data.data!;
  }

  async getLendingMetrics(): Promise<{
    total_disbursed: number;
    total_capital: number;
    active_loans_count: number;
    collection_rate: number;
    portfolio_at_risk: number;
  }> {
    const response = await this.client.get<ApiResponse<{
      total_disbursed: number;
      total_capital: number;
      active_loans_count: number;
      collection_rate: number;
      portfolio_at_risk: number;
    }>>('/lending/metrics');
    return response.data.data!;
  }

  async getTotalDisbursed(): Promise<number> {
    const response = await this.client.get<ApiResponse<{ total: number }>>('/stats/total-disbursed');
    return response.data.data!.total;
  }

  async getTotalCapital(): Promise<number> {
    const response = await this.client.get<ApiResponse<{ total: number }>>('/stats/total-capital');
    return response.data.data!.total;
  }

  async getActiveLoansCount(): Promise<number> {
    const response = await this.client.get<ApiResponse<{ count: number }>>('/stats/active-loans-count');
    return response.data.data!.count;
  }

  // ============================================
  // Transactions API
  // ============================================

  async getTransactions(params?: ListParams): Promise<PaginatedResponse<LedgerEntry>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<LedgerEntry>>>('/transactions', { params });
    return response.data.data!;
  }

  async getTransactionCount(): Promise<number> {
    const response = await this.client.get<ApiResponse<{ total: number }>>('/transactions/count');
    return response.data.data!.total;
  }

  async getTransactionsByShareholder(shareholderId: string): Promise<LedgerEntry[]> {
    const response = await this.client.get<ApiResponse<LedgerEntry[]>>(`/transactions/shareholder/${shareholderId}`);
    return response.data.data!;
  }

  async getTransactionsByReference(referenceId: string): Promise<LedgerEntry[]> {
    const response = await this.client.get<ApiResponse<LedgerEntry[]>>(`/transactions/reference/${referenceId}`);
    return response.data.data!;
  }

  async createTransaction(data: TransactionPayload): Promise<LedgerEntry> {
    const response = await this.client.post<ApiResponse<LedgerEntry>>('/transactions', data);
    return response.data.data!;
  }

  // ============================================
  // Dashboard API
  // ============================================

  async getDashboardStats(range?: string): Promise<{
    user_stats: unknown;
    transaction_stats: unknown;
    system_health: unknown;
    data_management: unknown;
    audit_summary: unknown;
    recent_activities: AuditLogEntry[];
  }> {
    const response = await this.client.get<ApiResponse<{
      user_stats: unknown;
      transaction_stats: unknown;
      system_health: unknown;
      data_management: unknown;
      audit_summary: unknown;
      recent_activities: AuditLogEntry[];
    }>>('/dashboard/stats', { params: { range } });
    return response.data.data!;
  }

  async getLoanChart(range?: string): Promise<{
    labels: string[];
    datasets: Array<{ label: string; data: number[]; backgroundColor: string; borderColor: string }>;
    status_breakdown: { labels: string[]; data: number[] };
  }> {
    const response = await this.client.get<ApiResponse<{
      labels: string[];
      datasets: Array<{ label: string; data: number[]; backgroundColor: string; borderColor: string }>;
      status_breakdown: { labels: string[]; data: number[] };
    }>>('/dashboard/charts/loans', { params: { range } });
    return response.data.data!;
  }

  async getShareCapitalChart(range?: string): Promise<{
    labels: string[];
    datasets: Array<{ label: string; data: number[]; backgroundColor: string; borderColor: string }>;
  }> {
    const response = await this.client.get<ApiResponse<{
      labels: string[];
      datasets: Array<{ label: string; data: number[]; backgroundColor: string; borderColor: string }>;
    }>>('/dashboard/charts/share-capital', { params: { range } });
    return response.data.data!;
  }

  async getRecentLoans(limit?: number): Promise<LoanRequestItem[]> {
    const response = await this.client.get<ApiResponse<LoanRequestItem[]>>('/dashboard/recent/loans', { params: { limit } });
    return response.data.data!;
  }

  async getRecentTransactions(limit?: number): Promise<LedgerEntry[]> {
    const response = await this.client.get<ApiResponse<LedgerEntry[]>>('/dashboard/recent/transactions', { params: { limit } });
    return response.data.data!;
  }

  async getTopShareholders(limit?: number): Promise<PlatformUser[]> {
    const response = await this.client.get<ApiResponse<PlatformUser[]>>('/dashboard/top-shareholders', { params: { limit } });
    return response.data.data!;
  }

  // ============================================
  // Notifications API
  // ============================================

  async getNotifications(shareholderId: string): Promise<NotificationItem[]> {
    const response = await this.client.get<ApiResponse<NotificationItem[]>>('/notifications', { params: { shareholder_id: shareholderId } });
    return response.data.data!;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.client.put(`/notifications/${id}/mark-as-read`);
  }

  async markAllNotificationsAsRead(shareholderId: string): Promise<void> {
    await this.client.put('/notifications/mark-all-read', { shareholder_id: shareholderId });
  }

  async deleteAllNotifications(shareholderId: string): Promise<void> {
    await this.client.delete('/notifications', { params: { shareholder_id: shareholderId } });
  }

  async sendEmail(to: string, subject: string, message: string): Promise<void> {
    await this.client.post('/send-email', { to, subject, message });
  }

  // ============================================
  // Activity Logs API
  // ============================================

  async getActivityLogs(params?: ListParams & { log_type?: string; user_id?: string; start_date?: string; end_date?: string }): Promise<PaginatedResponse<AuditLogEntry>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<AuditLogEntry>>>('/activity-logs', { params });
    return response.data.data!;
  }

  async getActivityLogCount(userId?: string): Promise<number> {
    const response = await this.client.get<ApiResponse<{ total: number }>>('/activity-logs/count', { params: { user_id: userId } });
    return response.data.data!.total;
  }

  async createActivityLog(data: { user_id: string; action: string; description?: string; log_type?: string }): Promise<AuditLogEntry> {
    const response = await this.client.post<ApiResponse<AuditLogEntry>>('/activity-logs', data);
    return response.data.data!;
  }

  async exportActivityLogs(params?: { log_type?: string; start_date?: string; end_date?: string }): Promise<Blob> {
    const response = await this.client.get('/activity-logs/export', { params, responseType: 'blob' });
    return response.data;
  }

  async cleanupActivityLogs(): Promise<{ count: number }> {
    const response = await this.client.post<ApiResponse<{ count: number }>>('/activity-logs/cleanup');
    return response.data.data!;
  }

  // ============================================
  // File Upload API
  // ============================================

  async uploadFile(file: File, folder?: string): Promise<{ url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    const response = await this.client.post<ApiResponse<{ url: string; path: string }>>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  }

  // ============================================
  // Import/Export API
  // ============================================

  async exportData(type: string, format: 'xlsx' | 'csv' | 'pdf'): Promise<Blob> {
    const response = await this.client.get(`/export/${type}/${format}`, { responseType: 'blob' });
    return response.data;
  }

  async previewImport(type: string, file: File): Promise<{
    total_rows: number;
    valid_rows: number;
    error_rows: number;
    duplicates: unknown[];
    errors: unknown[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<ApiResponse<{
      total_rows: number;
      valid_rows: number;
      error_rows: number;
      duplicates: unknown[];
      errors: unknown[];
    }>>(`/import/${type}/preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  }

  async confirmImport(type: string, file: File): Promise<{
    success_count: number;
    failure_count: number;
    error_report: unknown[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<ApiResponse<{
      success_count: number;
      failure_count: number;
      error_report: unknown[];
    }>>(`/import/${type}/confirm`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  }

  async downloadErrorReport(): Promise<Blob> {
    const response = await this.client.post('/import/error-report', {}, { responseType: 'blob' });
    return response.data;
  }

  // ============================================
  // Backup API
  // ============================================

  async getBackupSettings(): Promise<Record<string, string>> {
    const response = await this.client.get<ApiResponse<{ settings: Record<string, string> }>>('/backups/settings');
    return response.data.data!.settings;
  }

  async updateBackupSettings(settings: Record<string, string>): Promise<void> {
    await this.client.put('/backups/settings', { settings });
  }

  async runManualBackup(type: 'db' | 'files' | 'full' = 'db'): Promise<{ filename: string }> {
    const response = await this.client.post<ApiResponse<{ filename: string }>>('/backups/run', { type });
    return response.data.data!;
  }

  async listBackups(): Promise<Array<{ name: string; size: string; created_at: string; path: string }>> {
    const response = await this.client.get<ApiResponse<Array<{ name: string; size: string; created_at: string; path: string }>>>('/backups');
    return response.data.data!;
  }

  // ============================================
  // Admin Users API
  // ============================================

  async getAdminUsers(params?: ListParams): Promise<PaginatedResponse<PlatformUser>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<PlatformUser>>>('/admin/users', { params });
    return response.data.data!;
  }

  async getAdminUserCount(params?: { role?: string; status?: string }): Promise<number> {
    const response = await this.client.get<ApiResponse<{ count: number }>>('/admin/users/count', { params });
    return response.data.data!.count;
  }

  async getAdminUser(id: string): Promise<PlatformUser> {
    const response = await this.client.get<ApiResponse<PlatformUser>>(`/admin/users/${id}`);
    return response.data.data!;
  }

  async createAdminUser(data: UserPayload): Promise<PlatformUser> {
    const response = await this.client.post<ApiResponse<PlatformUser>>('/admin/users', data);
    return response.data.data!;
  }

  async updateAdminUser(id: string, data: Partial<UserPayload>): Promise<PlatformUser> {
    const response = await this.client.put<ApiResponse<PlatformUser>>(`/admin/users/${id}`, data);
    return response.data.data!;
  }

  async deleteAdminUser(id: string): Promise<void> {
    await this.client.delete(`/admin/users/${id}`);
  }

  async bulkDeleteUsers(ids: string[]): Promise<void> {
    await this.client.post('/admin/bulk-delete-users', { ids });
  }

  async getUserLoginHistory(id: string): Promise<AuditLogEntry[]> {
    const response = await this.client.get<ApiResponse<AuditLogEntry[]>>(`/admin/users/${id}/login-history`);
    return response.data.data!;
  }

  async impersonateUser(id: string): Promise<{ user: PlatformUser; token: string }> {
    const response = await this.client.post<ApiResponse<{ user: PlatformUser; token: string }>>(`/admin/users/${id}/impersonate`);
    return response.data.data!;
  }

  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended' | 'pending'): Promise<PlatformUser> {
    const response = await this.client.put<ApiResponse<PlatformUser>>(`/admin/users/${id}/status`, { status });
    return response.data.data!;
  }

  async updateUserAddress(id: string, address: string): Promise<PlatformUser> {
    const response = await this.client.put<ApiResponse<PlatformUser>>(`/admin/users/${id}/address`, { address });
    return response.data.data!;
  }

  // ============================================
  // POS API
  // ============================================

  async getPosCatalog(search?: string): Promise<{ products: unknown[]; shareholders: unknown[] }> {
    const response = await this.client.get<ApiResponse<{ products: unknown[]; shareholders: unknown[] }>>('/pos/catalog', { params: { search } });
    return response.data.data!;
  }

  async recordPosSale(data: {
    client_uuid: string;
    terminal_id: string;
    cashier_id?: string;
    shareholder_id?: string;
    cart: { lines: unknown[]; subtotal: number; discount_total: number; tax_total: number; grand_total: number };
    tender: { type: string; amount_received?: number; cash_amount?: number; credit_amount?: number; amount?: number };
  }): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>('/pos/sales', data);
    return response.data.data!;
  }

  async syncPos(data: unknown): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>('/pos/sync', data);
    return response.data.data!;
  }

  async getPosStatus(): Promise<unknown> {
    const response = await this.client.get<ApiResponse<unknown>>('/pos/status');
    return response.data.data!;
  }

  // ============================================
  // Products API
  // ============================================

  async getProducts(params?: ListParams): Promise<PaginatedResponse<unknown>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<unknown>>>('/products', { params });
    return response.data.data!;
  }

  async createProduct(data: ProductPayload): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>('/products', data);
    return response.data.data!;
  }

  async getProduct(id: string): Promise<unknown> {
    const response = await this.client.get<ApiResponse<unknown>>(`/products/${id}`);
    return response.data.data!;
  }

  async updateProduct(id: string, data: Partial<ProductPayload> & { version: number }): Promise<unknown> {
    const response = await this.client.put<ApiResponse<unknown>>(`/products/${id}`, data);
    return response.data.data!;
  }

  async deleteProduct(id: string, force?: boolean): Promise<void> {
    await this.client.delete(`/products/${id}`, { params: { force } });
  }

  async restoreProduct(id: string): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>(`/products/${id}/restore`);
    return response.data.data!;
  }

  async bulkActionProducts(ids: string[], action: 'delete' | 'restore' | 'update_status' | 'export', status?: string): Promise<void> {
    await this.client.post('/products/bulk-action', { ids, action, status });
  }

  async getProductBatches(id: string): Promise<unknown[]> {
    const response = await this.client.get<ApiResponse<unknown[]>>(`/products/${id}/batches`);
    return response.data.data!;
  }

  // ============================================
  // Consignees API
  // ============================================

  async getConsignees(params?: ListParams): Promise<PaginatedResponse<unknown>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<unknown>>>('/consignees', { params });
    return response.data.data!;
  }

  async searchConsignees(query: string): Promise<unknown[]> {
    const response = await this.client.get<ApiResponse<unknown[]>>('/consignees/search', { params: { query } });
    return response.data.data!;
  }

  async createConsignee(data: { full_name: string; phone?: string; address?: string }): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>('/consignees', data);
    return response.data.data!;
  }

  async getConsignee(id: string): Promise<unknown> {
    const response = await this.client.get<ApiResponse<unknown>>(`/consignees/${id}`);
    return response.data.data!;
  }

  async updateConsignee(id: string, data: { version: number; full_name?: string; phone?: string; address?: string }): Promise<unknown> {
    const response = await this.client.put<ApiResponse<unknown>>(`/consignees/${id}`, data);
    return response.data.data!;
  }

  async deleteConsignee(id: string, force?: boolean): Promise<void> {
    await this.client.delete(`/consignees/${id}`, { params: { force } });
  }

  async restoreConsignee(id: string): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>(`/consignees/${id}/restore`);
    return response.data.data!;
  }

  async bulkActionConsignees(ids: string[], action: 'delete' | 'restore' | 'export'): Promise<void> {
    await this.client.post('/consignees/bulk-action', { ids, action });
  }

  async exportConsignees(params?: ListParams): Promise<Blob> {
    const response = await this.client.get('/consignees/export', { params, responseType: 'blob' });
    return response.data;
  }

  // ============================================
  // Reports API
  // ============================================

  async getAvailableReports(): Promise<unknown[]> {
    const response = await this.client.get<ApiResponse<unknown[]>>('/reports');
    return response.data.data!;
  }

  async generateReport(reportType: string, format: 'pdf' | 'xlsx' = 'pdf', filters?: Record<string, unknown>): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>('/reports/generate', { report_type: reportType, format, filters });
    return response.data.data!;
  }

  async downloadReport(filename: string): Promise<Blob> {
    const response = await this.client.get(`/reports/download/${filename}`, { responseType: 'blob' });
    return response.data;
  }

  async getReportPreferences(): Promise<unknown[]> {
    const response = await this.client.get<ApiResponse<unknown[]>>('/reports/preferences');
    return response.data.data!;
  }

  async saveReportPreference(data: { name: string; report_type: string; format?: 'pdf' | 'xlsx'; filters?: Record<string, unknown> }): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>('/reports/preferences', data);
    return response.data.data!;
  }

  async scheduleReportEmail(reportType: string, email: string, format: 'pdf' | 'xlsx' = 'pdf', filters?: Record<string, unknown>): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>('/reports/schedule', { report_type: reportType, email, format, filters });
    return response.data.data!;
  }

  // ============================================
  // Health Check
  // ============================================

  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get<{ status: string }>('/health');
    return response.data;
  }
}

// ============================================
// Error Type
// ============================================

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  data?: unknown;
}

// ============================================
// Singleton Instance
// ============================================

export const api = new ApiService();

// ============================================
// React Query Keys (for future use with TanStack Query)
// ============================================

export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
  },
  shareholders: {
    list: (params?: ListParams) => ['shareholders', 'list', params] as const,
    count: ['shareholders', 'count'] as const,
    detail: (id: string) => ['shareholders', 'detail', id] as const,
    byUserId: (userId: string) => ['shareholders', 'byUserId', userId] as const,
    byEmail: (email: string) => ['shareholders', 'byEmail', email] as const,
  },
  loans: {
    requests: {
      list: (params?: ListParams) => ['loans', 'requests', 'list', params] as const,
      count: ['loans', 'requests', 'count'] as const,
      detail: (id: string) => ['loans', 'requests', 'detail', id] as const,
    },
    list: (params?: ListParams) => ['loans', 'list', params] as const,
    detail: (id: string) => ['loans', 'detail', id] as const,
    payments: (loanId: string) => ['loans', 'payments', loanId] as const,
    byShareholder: (shareholderId: string) => ['loans', 'byShareholder', shareholderId] as const,
    settings: {
      interestRate: ['loans', 'settings', 'interestRate'] as const,
      interestRateHistory: ['loans', 'settings', 'interestRateHistory'] as const,
      metrics: ['loans', 'settings', 'metrics'] as const,
    },
  },
  transactions: {
    list: (params?: ListParams) => ['transactions', 'list', params] as const,
    count: ['transactions', 'count'] as const,
    byShareholder: (shareholderId: string) => ['transactions', 'byShareholder', shareholderId] as const,
    byReference: (referenceId: string) => ['transactions', 'byReference', referenceId] as const,
  },
  dashboard: {
    stats: (range?: string) => ['dashboard', 'stats', range] as const,
    loanChart: (range?: string) => ['dashboard', 'loanChart', range] as const,
    shareCapitalChart: (range?: string) => ['dashboard', 'shareCapitalChart', range] as const,
    recentLoans: (limit?: number) => ['dashboard', 'recentLoans', limit] as const,
    recentTransactions: (limit?: number) => ['dashboard', 'recentTransactions', limit] as const,
    topShareholders: (limit?: number) => ['dashboard', 'topShareholders', limit] as const,
  },
  notifications: {
    list: (shareholderId: string) => ['notifications', 'list', shareholderId] as const,
  },
  activityLogs: {
    list: (params?: ListParams) => ['activityLogs', 'list', params] as const,
    count: (userId?: string) => ['activityLogs', 'count', userId] as const,
  },
  backups: {
    list: ['backups', 'list'] as const,
    settings: ['backups', 'settings'] as const,
  },
  admin: {
    users: {
      list: (params?: ListParams) => ['admin', 'users', 'list', params] as const,
      count: (params?: { role?: string; status?: string }) => ['admin', 'users', 'count', params] as const,
      detail: (id: string) => ['admin', 'users', 'detail', id] as const,
      loginHistory: (id: string) => ['admin', 'users', 'loginHistory', id] as const,
    },
  },
  pos: {
    catalog: (search?: string) => ['pos', 'catalog', search] as const,
    status: ['pos', 'status'] as const,
  },
  products: {
    list: (params?: ListParams) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    batches: (id: string) => ['products', 'batches', id] as const,
  },
  consignees: {
    list: (params?: ListParams) => ['consignees', 'list', params] as const,
    search: (query: string) => ['consignees', 'search', query] as const,
    detail: (id: string) => ['consignees', 'detail', id] as const,
  },
  reports: {
    available: ['reports', 'available'] as const,
    preferences: ['reports', 'preferences'] as const,
  },
} as const;