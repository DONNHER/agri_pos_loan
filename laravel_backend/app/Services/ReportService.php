<?php

namespace App\Services;

use App\Exports\ReportExport;
use App\Models\ActivityLog;
use App\Models\Loan;
use App\Models\Transaction;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Str;

class ReportService
{
    public function getAvailableReports(): array
    {
        return [
            [
                'key' => 'user_activity',
                'name' => 'User Activity Report',
                'description' => 'Activity log report by date, role and action.',
                'filters' => ['date_range', 'user_role', 'action_type'],
                'formats' => ['pdf', 'xlsx'],
            ],
            [
                'key' => 'transaction_summary',
                'name' => 'Transaction Summary',
                'description' => 'Summary of transactions by period, category and status.',
                'filters' => ['period', 'category', 'status'],
                'formats' => ['pdf', 'xlsx'],
            ],
            [
                'key' => 'audit_trail',
                'name' => 'Audit Trail Report',
                'description' => 'Detailed audit trail for users and modules.',
                'filters' => ['user', 'date_range', 'module', 'action'],
                'formats' => ['pdf', 'xlsx'],
            ],
            [
                'key' => 'system_usage',
                'name' => 'System Usage Statistics',
                'description' => 'Usage statistics for the platform over time.',
                'filters' => ['period'],
                'formats' => ['pdf'],
            ],
            [
                'key' => 'custom',
                'name' => 'Custom Report Builder',
                'description' => 'Create a custom report from users, transactions, loans or activity logs.',
                'filters' => ['resource', 'filters'],
                'formats' => ['pdf', 'xlsx'],
            ],
        ];
    }

    public function generate(string $reportType, string $format = 'pdf', array $filters = []): array
    {
        $reportData = $this->buildReportData($reportType, $filters);
        $extension = $format === 'xlsx' ? 'xlsx' : 'pdf';
        $fileName = Str::slug($reportType) . '_' . now()->format('Ymd_His') . '.' . $extension;
        $directory = storage_path('app/reports');

        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $path = $directory . DIRECTORY_SEPARATOR . $fileName;

        if ($format === 'xlsx') {
            $rows = $reportData['rows'] ?? [];
            $headers = $reportData['headers'] ?? [];
            Excel::store(new ReportExport($headers, $rows), 'reports/' . $fileName, 'local');
        } else {
            $html = view('reports.generic', [
                'title' => $reportData['title'],
                'subtitle' => $reportData['subtitle'],
                'filters' => $filters,
                'summary' => $reportData['summary'] ?? [],
                'rows' => $reportData['rows'] ?? [],
                'headers' => $reportData['headers'] ?? [],
                'chartData' => $reportData['chartData'] ?? [],
                'generatedAt' => now()->toDateTimeString(),
            ])->render();

            $pdf = Pdf::loadHTML($html)
                ->setPaper('a4', 'portrait');
            $pdf->getDomPDF()->getCanvas()->page_text(
                520,
                770,
                'Page {PAGE_NUM} of {PAGE_COUNT}',
                null,
                10,
                [0, 0, 0]
            );
            $pdf->save($path);
        }

        return [
            'success' => true,
            'report_type' => $reportType,
            'format' => $format,
            'filename' => $fileName,
            'path' => $path,
            'download_url' => '/api/reports/download/' . $fileName,
            'delivery_options' => [
                'download' => true,
                'email' => true,
            ],
            'summary' => $reportData['summary'] ?? [],
        ];
    }

    public function sendReportByEmail(string $reportType, string $format = 'pdf', array $filters = [], string $email): array
    {
        $report = $this->generate($reportType, $format, $filters);
        $fullPath = $report['path'];

        Mail::send([], [], function ($message) use ($email, $reportType, $fullPath, $format) {
            $message->to($email)
                ->subject('Scheduled ' . ucfirst(str_replace('_', ' ', $reportType)) . ' Report')
                ->html('<p>Please find the attached report.</p>');

            $message->attach($fullPath, [
                'as' => basename($fullPath),
                'mime' => $format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
            ]);
        });

        return $report;
    }

    protected function buildReportData(string $reportType, array $filters = []): array
    {
        $period = $filters['period'] ?? 'monthly';
        $startDate = $filters['start_date'] ?? null;
        $endDate = $filters['end_date'] ?? null;

        switch ($reportType) {
            case 'user_activity':
                return $this->buildUserActivityReport($filters, $startDate, $endDate);
            case 'transaction_summary':
                return $this->buildTransactionSummaryReport($filters, $startDate, $endDate, $period);
            case 'audit_trail':
                return $this->buildAuditTrailReport($filters, $startDate, $endDate);
            case 'system_usage':
                return $this->buildSystemUsageReport($filters, $period);
            case 'custom':
            default:
                return $this->buildCustomReport($filters);
        }
    }

    protected function buildUserActivityReport(array $filters, ?string $startDate, ?string $endDate): array
    {
        $query = ActivityLog::query()->with('user');
        if ($startDate) $query->whereDate('created_at', '>=', $startDate);
        if ($endDate) $query->whereDate('created_at', '<=', $endDate);
        if (!empty($filters['user_role'])) $query->whereHas('user', fn ($q) => $q->where('role', $filters['user_role']));
        if (!empty($filters['action_type'])) $query->where('action', 'like', '%' . $filters['action_type'] . '%');

        $rows = $query->orderByDesc('created_at')->get()->map(function ($log) {
            return [
                'date' => $log->created_at->format('Y-m-d H:i'),
                'user' => $log->user->email ?? 'Unknown',
                'role' => $log->user->role ?? 'n/a',
                'action' => $log->action,
                'details' => $log->description,
            ];
        })->toArray();

        return [
            'title' => 'User Activity Report',
            'subtitle' => 'Detailed activity for the selected period',
            'summary' => [
                ['label' => 'Total Entries', 'value' => count($rows)],
                ['label' => 'Distinct Users', 'value' => count(array_unique(array_column($rows, 'user')))],
            ],
            'headers' => ['Date', 'User', 'Role', 'Action', 'Details'],
            'rows' => $rows,
        ];
    }

    protected function buildTransactionSummaryReport(array $filters, ?string $startDate, ?string $endDate, string $period): array
    {
        $query = Transaction::query();
        if ($startDate) $query->whereDate('date', '>=', $startDate);
        if ($endDate) $query->whereDate('date', '<=', $endDate);
        if (!empty($filters['category'])) $query->where('type', $filters['category']);
        if (!empty($filters['status'])) $query->where('status', $filters['status']);

        $rows = $query->orderBy('date')->get()->map(function ($transaction) {
            return [
                'date' => $transaction->date ? $transaction->date->format('Y-m-d') : '-',
                'type' => $transaction->type,
                'status' => $transaction->status,
                'amount' => number_format($transaction->amount, 2),
            ];
        })->toArray();

        $chartData = [];
        $grouped = $query->get()->groupBy(function ($transaction) {
            return $transaction->date ? $transaction->date->format('Y-m') : 'n/a';
        });
        foreach ($grouped as $key => $items) {
            $chartData[] = ['label' => $key, 'value' => round($items->sum('amount'), 2)];
        }

        return [
            'title' => 'Transaction Summary',
            'subtitle' => 'Transaction totals grouped by period',
            'summary' => [
                ['label' => 'Total Transactions', 'value' => count($rows)],
                ['label' => 'Total Amount', 'value' => number_format($query->sum('amount'), 2)],
            ],
            'headers' => ['Date', 'Type', 'Status', 'Amount'],
            'rows' => $rows,
            'chartData' => $chartData,
        ];
    }

    protected function buildAuditTrailReport(array $filters, ?string $startDate, ?string $endDate): array
    {
        $query = ActivityLog::query()->with('user');
        if ($startDate) $query->whereDate('created_at', '>=', $startDate);
        if ($endDate) $query->whereDate('created_at', '<=', $endDate);
        if (!empty($filters['user'])) $query->whereHas('user', fn ($q) => $q->where('email', 'like', '%' . $filters['user'] . '%'));
        if (!empty($filters['module'])) $query->where('description', 'like', '%' . $filters['module'] . '%');
        if (!empty($filters['action'])) $query->where('action', 'like', '%' . $filters['action'] . '%');

        $rows = $query->orderByDesc('created_at')->get()->map(function ($log) {
            return [
                'date' => $log->created_at->format('Y-m-d H:i'),
                'user' => $log->user->email ?? 'Unknown',
                'module' => $log->description,
                'action' => $log->action,
                'details' => $log->ip_address,
            ];
        })->toArray();

        return [
            'title' => 'Audit Trail Report',
            'subtitle' => 'System activity by user and module',
            'summary' => [
                ['label' => 'Entries', 'value' => count($rows)],
            ],
            'headers' => ['Date', 'User', 'Module', 'Action', 'Details'],
            'rows' => $rows,
        ];
    }

    protected function buildSystemUsageReport(array $filters, string $period): array
    {
        $query = ActivityLog::query();
        $monthly = $query->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $chartData = $monthly->map(fn ($item) => ['label' => $item->month, 'value' => (int) $item->count])->toArray();

        return [
            'title' => 'System Usage Statistics',
            'subtitle' => 'Platform activity over time',
            'summary' => [
                ['label' => 'Period', 'value' => ucfirst($period)],
                ['label' => 'Entries', 'value' => $monthly->sum('count')],
            ],
            'headers' => ['Month', 'Activity Count'],
            'rows' => $monthly->map(fn ($item) => ['month' => $item->month, 'activity_count' => $item->count])->toArray(),
            'chartData' => $chartData,
        ];
    }

    protected function buildCustomReport(array $filters): array
    {
        $resource = $filters['resource'] ?? 'transactions';
        $filterSet = $filters['filters'] ?? [];

        $query = null;
        switch ($resource) {
            case 'users':
                $query = User::query();
                break;
            case 'transactions':
                $query = Transaction::query();
                break;
            case 'loans':
                $query = Loan::query();
                break;
            case 'activity-logs':
            case 'activity_logs':
                $query = ActivityLog::query()->with('user');
                break;
            default:
                $query = Transaction::query();
        }

        if ($query === null) {
            return [
                'title' => 'Custom Report',
                'subtitle' => 'No data available',
                'summary' => [],
                'headers' => [],
                'rows' => [],
            ];
        }

        if (!empty($filterSet['start_date'])) $query->whereDate('created_at', '>=', $filterSet['start_date']);
        if (!empty($filterSet['end_date'])) $query->whereDate('created_at', '<=', $filterSet['end_date']);
        if (!empty($filterSet['status'])) $query->where('status', $filterSet['status']);
        if (!empty($filterSet['role'])) $query->where('role', $filterSet['role']);
        if (!empty($filterSet['action'])) $query->where('action', 'like', '%' . $filterSet['action'] . '%');
        if (!empty($filterSet['type'])) $query->where('type', $filterSet['type']);

        $rows = $query->take(100)->get()->map(function ($item) use ($resource) {
            if ($resource === 'users') {
                return [
                    'name' => $item->firstname . ' ' . $item->lastname,
                    'email' => $item->email,
                    'role' => $item->role,
                    'status' => $item->status,
                ];
            }
            if ($resource === 'loans') {
                return [
                    'id' => $item->id,
                    'status' => $item->status,
                    'principal_amount' => $item->principal_amount,
                    'remaining_balance' => $item->remaining_balance,
                ];
            }
            if ($resource === 'activity-logs' || $resource === 'activity_logs') {
                return [
                    'date' => $item->created_at->format('Y-m-d H:i'),
                    'user' => $item->user->email ?? 'Unknown',
                    'action' => $item->action,
                    'details' => $item->description,
                ];
            }

            return [
                'date' => $item->date ? $item->date->format('Y-m-d') : '-',
                'type' => $item->type,
                'status' => $item->status,
                'amount' => number_format($item->amount, 2),
            ];
        })->toArray();

        return [
            'title' => 'Custom Report',
            'subtitle' => 'Dynamic report from ' . $resource,
            'summary' => [
                ['label' => 'Rows', 'value' => count($rows)],
            ],
            'headers' => array_keys($rows[0] ?? []),
            'rows' => $rows,
        ];
    }
}
