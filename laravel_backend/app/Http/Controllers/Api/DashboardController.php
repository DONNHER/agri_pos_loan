<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use App\Models\LoanRequest;
use App\Models\Loan;
use App\Models\Transaction;
use App\Models\Shareholder;
use App\Models\ShareCapital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
            \Log::info('DashboardController::getStats called', ['range' => $request->get('range', 'week')]);
        
            try {
                $range = $request->get('range', 'week');
                $startDate = $this->getStartDate($range);

                $result = [
                    'success' => true,
                    'user_stats' => $this->getUserStats($startDate, $range),
                    'transaction_stats' => $this->getTransactionStats($startDate, $range),
                    'system_health' => $this->getSystemHealth(),
                    'data_management' => $this->getDataManagementStats(),
                    'audit_summary' => $this->getAuditSummary(),
                    'recent_activities' => ActivityLog::with('user:id,firstname,lastname')->latest()->limit(5)->get(),
                ];
            
                \Log::info('DashboardController::getStats success');
                return response()->json($result);
            } catch (\Exception $e) {
                \Log::error('DashboardController::getStats error', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ], 500);
            }
        }

    public function getLoanChart(Request $request)
    {
        $range = $request->get('range', 'month');
        $startDate = $this->getStartDate($range);

        $isPgSql = DB::getDriverName() === 'pgsql';
        $format = $isPgSql
            ? match ($range) { 'day' => 'HH24:00', 'year' => 'YYYY-MM', default => 'YYYY-MM-DD' }
            : match ($range) { 'day' => '%H:00', 'year' => '%Y-%m', default => '%Y-%m-%d' };
        $labelExpr = $isPgSql ? "TO_CHAR(created_at, '$format')" : "DATE_FORMAT(created_at, '$format')";

        // Loan counts by status
        $statusData = Loan::where('created_at', '>=', $startDate)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // Loan amounts by month
        $monthlyData = Loan::where('created_at', '>=', $startDate)
            ->select(DB::raw("$labelExpr as label"), DB::raw('sum(principal_amount) as total'))
            ->groupBy(DB::raw($labelExpr))
            ->orderBy(DB::raw($labelExpr), 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'labels' => $monthlyData->pluck('label'),
                'datasets' => [
                    [
                        'label' => 'Loan Principal',
                        'data' => $monthlyData->pluck('total'),
                        'backgroundColor' => 'rgba(79, 70, 229, 0.5)',
                        'borderColor' => 'rgb(79, 70, 229)',
                    ],
                ],
                'status_breakdown' => [
                    'labels' => $statusData->pluck('status'),
                    'data' => $statusData->pluck('count'),
                ],
            ],
        ]);
    }

    public function getShareCapitalChart(Request $request)
    {
        $range = $request->get('range', 'month');
        $startDate = $this->getStartDate($range);

        $isPgSql = DB::getDriverName() === 'pgsql';
        $format = $isPgSql
            ? match ($range) { 'day' => 'HH24:00', 'year' => 'YYYY-MM', default => 'YYYY-MM-DD' }
            : match ($range) { 'day' => '%H:00', 'year' => '%Y-%m', default => '%Y-%m-%d' };
        $labelExpr = $isPgSql ? "TO_CHAR(created_at, '$format')" : "DATE_FORMAT(created_at, '$format')";

        // Share capital growth over time
        $monthlyData = ShareCapital::where('created_at', '>=', $startDate)
            ->select(DB::raw("$labelExpr as label"), DB::raw('sum(amount) as total'))
            ->groupBy(DB::raw($labelExpr))
            ->orderBy(DB::raw($labelExpr), 'asc')
            ->get();

        // Top shareholders by share capital
        $topShareholders = Shareholder::select('id', 'first_name', 'last_name', 'total_share_capital')
            ->orderBy('total_share_capital', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'labels' => $monthlyData->pluck('label'),
                'datasets' => [
                    [
                        'label' => 'Share Capital',
                        'data' => $monthlyData->pluck('total'),
                        'backgroundColor' => 'rgba(139, 92, 246, 0.5)',
                        'borderColor' => 'rgb(139, 92, 246)',
                    ],
                ],
                'top_shareholders' => $topShareholders->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->first_name . ' ' . $s->last_name,
                        'share_capital' => $s->total_share_capital,
                    ];
                }),
            ],
        ]);
    }

    public function getRecentLoans(Request $request)
    {
        $limit = min(max((int) $request->get('limit', 10), 1), 50);

        $loans = Loan::with('shareholder:id,first_name,last_name')
            ->latest('created_at')
            ->limit($limit)
            ->get()
            ->map(function ($loan) {
                return [
                    'id' => $loan->id,
                    'loanRequestId' => $loan->loan_request_id,
                    'shareholderId' => $loan->shareholder_id,
                    'principal' => (float) $loan->principal_amount,
                    'balance' => (float) $loan->remaining_balance,
                    'remainingBalance' => (float) $loan->remaining_balance,
                    'interestRate' => (float) $loan->interest_rate,
                    'status' => $loan->status,
                    'releaseDate' => $loan->release_date?->toISOString(),
                    'nextRepaymentDate' => $loan->next_repayment_date?->toISOString(),
                    'tenureMonths' => $loan->tenure_months,
                    'disbursedAt' => $loan->release_date?->toISOString(),
                    'processingFee' => (float) ($loan->processing_fee ?? 0),
                    'totalRepayableField' => (float) ($loan->total_repayable ?? 0),
                    'totalAmountToPay' => (float) ($loan->total_amount_to_pay ?? 0),
                    'shareholder' => $loan->shareholder ? [
                        'id' => $loan->shareholder->id,
                        'firstName' => $loan->shareholder->first_name,
                        'lastName' => $loan->shareholder->last_name,
                    ] : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $loans,
        ]);
    }

    public function getRecentTransactions(Request $request)
    {
        $limit = min(max((int) $request->get('limit', 10), 1), 50);

        $transactions = Transaction::with('shareholder:id,first_name,last_name')
            ->latest('date')
            ->limit($limit)
            ->get()
            ->map(function ($txn) {
                return [
                    'id' => (string) $txn->id,
                    'referenceId' => $txn->reference_id,
                    'shareholderId' => $txn->shareholder_id,
                    'type' => $txn->type,
                    'method' => $txn->method,
                    'clientName' => $txn->shareholder ? $txn->shareholder->first_name . ' ' . $txn->shareholder->last_name : 'Unknown',
                    'amount' => (float) $txn->amount,
                    'status' => $txn->status,
                    'date' => $txn->date?->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    public function getTopShareholders(Request $request)
    {
        $limit = min(max((int) $request->get('limit', 10), 1), 50);

        $shareholders = Shareholder::select('id', 'user_id', 'first_name', 'last_name', 'email', 'contact_number', 'address', 'creditscore', 'total_share_capital', 'id_image_url', 'created_at')
            ->orderBy('total_share_capital', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'userId' => $s->user_id,
                    'firstName' => $s->first_name,
                    'lastName' => $s->last_name,
                    'email' => $s->email,
                    'phone' => $s->contact_number,
                    'address' => $s->address,
                    'creditScore' => (int) $s->creditscore,
                    'shareCapital' => (float) $s->total_share_capital,
                    'avatarUrl' => null,
                    'idImageUrl' => $s->id_image_url,
                    'createdAt' => $s->created_at?->toISOString(),
                    'updatedAt' => null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $shareholders,
        ]);
    }

    private function getSystemHealth()
    {
            $driver = DB::getDriverName();
        $dbSize = 'Unknown';

        try {
                if ($driver === 'pgsql') {
                $dbSize = DB::select("SELECT pg_size_pretty(pg_database_size(current_database())) as size")[0]->size;
                } elseif ($driver === 'mysql') {
                $dbName = config('database.connections.mysql.database');
                $dbSize = DB::select("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size FROM information_schema.TABLES WHERE table_schema = ?", [$dbName])[0]->size . ' MB';
                } elseif ($driver === 'sqlite') {
                    $dbPath = config('database.connections.sqlite.database');
                    if (file_exists($dbPath)) {
                        $sizeBytes = filesize($dbPath);
                        $dbSize = round($sizeBytes / 1024 / 1024, 2) . ' MB';
                    }
                }
            } catch (\Exception $e) {}

            return [
                'db_size' => $dbSize,
                'storage_usage' => 45,
                'failed_jobs' => Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->count() : 0,
                'uptime' => '99.9%'
            ];
        }

    private function getDataManagementStats()
    {
        return [
                'recent_imports' => [],
                'recent_exports' => [],
            'backup_status' => [
                'last_run' => now()->subDay()->format('M d, Y H:i'),
                'health' => 'Healthy',
                'location' => 'S3 / Local'
            ]
        ];
    }

    private function getAuditSummary()
    {
        return [
                'critical_events_count' => \App\Models\ActivityLog::whereIn('action', ['deleted', 'security_breach'])->count(),
                'total_audits_today' => \App\Models\ActivityLog::whereDate('created_at', now())->count(),
        ];
    }

    private function getStartDate($range)
    {
        return match ($range) {
            'day' => now()->startOfDay(),
            'week' => now()->subDays(7)->startOfDay(),
            'month' => now()->subMonth()->startOfDay(),
            'year' => now()->subYear()->startOfDay(),
            default => now()->subDays(7)->startOfDay(),
        };
    }

    private function getUserStats($startDate, $range)
    {
        $isPgSql = DB::getDriverName() === 'pgsql';
        $format = $isPgSql
            ? match ($range) { 'day' => 'HH24:00', 'year' => 'YYYY-MM', default => 'YYYY-MM-DD' }
            : match ($range) { 'day' => '%H:00', 'year' => '%Y-%m', default => '%Y-%m-%d' };
        $labelExpr = $isPgSql ? "TO_CHAR(created_at, '$format')" : "DATE_FORMAT(created_at, '$format')";

        $registrationTrend = User::where('created_at', '>=', $startDate)
            ->select(DB::raw("$labelExpr as label"), DB::raw('count(*) as count'))
            ->groupBy(DB::raw($labelExpr))
            ->orderBy(DB::raw($labelExpr), 'asc')
            ->get();

        return [
            'total_users' => User::count(),
            'active_now' => DB::table('personal_access_tokens')
                ->where('last_used_at', '>', now()->subMinutes(15))
                ->distinct('tokenable_id')
                ->count(),
            'new_registrations' => User::where('created_at', '>=', $startDate)->count(),
            'trend' => [
                'labels' => $registrationTrend->pluck('label'),
                'data' => $registrationTrend->pluck('count'),
            ]
        ];
    }

    private function getTransactionStats($startDate, $range)
    {
        $isPgSql = DB::getDriverName() === 'pgsql';

        $format = $isPgSql
            ? match ($range) { 'day' => 'HH24:00', 'year' => 'YYYY-MM', default => 'YYYY-MM-DD' }
            : match ($range) { 'day' => '%H:00', 'year' => '%Y-%m', default => '%Y-%m-%d' };
        $labelExpr = $isPgSql ? "TO_CHAR(created_at, '$format')" : "DATE_FORMAT(created_at, '$format')";

        $chartData = ActivityLog::where('log_type', 'transaction')
            ->where('created_at', '>=', $startDate)
            ->select(DB::raw("$labelExpr as label"), DB::raw('count(*) as count'))
            ->groupBy(DB::raw($labelExpr))
            ->orderBy(DB::raw($labelExpr), 'asc')
            ->get();

        return [
            'activity_chart' => [
                'labels' => $chartData->pluck('label'),
                'datasets' => [['label' => 'Transactions', 'data' => $chartData->pluck('count')]]
            ],
            'total_count' => $chartData->sum('count'),
        ];
    }
}
