# API Documentation - Capstone Application Backend

This document outlines the technical architecture and primary API endpoints for the Capstone Application.

## 🏗️ System Architecture
- **Frontend**: Flutter (Cross-platform Mobile & Desktop)
- **Backend**: Laravel 10 (PHP 8.2+)
- **Database**: PostgreSQL (Hosted on **Supabase**)
- **Authentication**: Laravel Sanctum (Token-based)
- **Security Middleware**: Custom `IsAdmin`, MFA Verification, and Rate Limiting.
- **Storage**: Laravel Public Disk for assets and Local Storage for automated backups.

---

## 🔐 Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/login` | Login with email & password. Returns `mfa_required` if enabled. |
| POST | `/api/verify-mfa` | Verify 6-digit OTP sent via email. |
| POST | `/api/register` | Register a new user account. |
| POST | `/api/logout` | Revoke current access token. |
| POST | `/api/forgot-password` | Request password reset OTP. |
| POST | `/api/reset-password` | Reset password using OTP. |

---

## 🛡️ Advanced User Management (Admin Only)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/admin/users` | List users with pagination, search, and filters. |
| POST | `/api/admin/users` | Create a new user. |
| PUT | `/api/admin/users/{id}` | Update user (Requires `version` for optimistic locking). |
| DELETE | `/api/admin/users/{id}` | Soft-delete a user. |
| POST | `/api/admin/users/{id}/restore` | Restore a soft-deleted user. |
| POST | `/api/admin/users/{id}/impersonate` | Generate a support token to login as this user. |
| POST | `/api/admin/users/{id}/force-logout` | Revoke all tokens for this user. |
| GET | `/api/admin/users/{id}/analytics` | Get user activity stats and most used features. |

---

## 💾 Automated Backups (Admin Only)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/backups` | List all available backup files. |
| GET | `/api/backups/settings` | Get backup frequency and email settings. |
| PUT | `/api/backups/settings` | Update backup configuration. |
| POST | `/api/backups/run` | Trigger manual backup (`type`: db, files, full). |

---

## 📊 Dashboard & Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/dashboard/stats` | Get system-wide metrics, charts, and health (Optimized for PGSQL). |
| GET | `/api/activity-logs` | View audit trail with search and filters. |
| GET | `/api/activity-logs/export` | Download audit logs as CSV. |

---

## 📁 Data Controls (Standard for all modules)
All listing endpoints support the following query parameters:
- `search`: Global search string.
- `sort_by`: Column name to sort by.
- `sort_order`: `asc` or `desc`.
- `per_page`: `10`, `25`, `50`, or `100`.
- `trashed_only`: Show soft-deleted items only.
- `version`: Required for all `PUT` requests to prevent concurrent edit conflicts.

## 📦 Bulk Actions
Available at `/api/{module}/bulk-action`.
Payload:
```json
{
  "ids": ["uuid1", "uuid2"],
  "action": "delete" | "restore" | "update_status" | "export",
  "status": "active"
}
```
