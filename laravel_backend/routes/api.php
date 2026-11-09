<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ShareholderController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\ConsigneeController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\FileUploadController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\DatabaseStatusController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('throttle:auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/login-password', [AuthController::class, 'loginPassword']);
    Route::post('/pos/offline-login', [PosController::class, 'offlineLogin']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/verify-mfa', [AuthController::class, 'verifyMfa']);
    Route::post('/resend-mfa', [AuthController::class, 'resendMfa']);
});
// 🚀 Public User Lookup by Email (Supports Admin, Cashier, and Shareholder roles)
Route::get('/user/by-email', function (Request $request) {
    $email = $request->query('email');
    $user = \App\Models\User::with('shareholder')->where('email', $email)->first();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'User not found'
        ], 404);
    }

    return response()->json($user);
});
// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/pos/logout', [AuthController::class, 'logout']);
    Route::get('/pos/catalog', [PosController::class, 'catalog']);
    Route::post('/pos/sales', [PosController::class, 'storeSale']);
    Route::post('/pos/sync', [PosController::class, 'sync']);
    Route::get('/pos/status', [PosController::class, 'status']);
    Route::get('/user', function (Request $request) {
        // 🚀 Eager load shareholder to provide address and other details
        return $request->user()->load('shareholder');
    });
    
    // Support both PUT and POST for profile updates
    Route::match(['PUT', 'POST'], '/user/profile', [AuthController::class, 'updateProfile']);
    Route::match(['PUT', 'POST'], '/user/change-password', [AuthController::class, 'changePassword']);

    // 🚀 Loan Requests
    Route::get('/loan-requests/count', [LoanController::class, 'countRequests']);
    Route::post('/loan-requests/{id}/comaker-decision', [LoanController::class, 'setComakerDecision']);
    Route::post('/loan-requests/{id}/disburse', [LoanController::class, 'disburse']);
    Route::match(['PUT', 'POST'], '/loan-requests/{id}/status', [LoanController::class, 'updateRequestStatus']);
    Route::get('/loan-requests/{id}', [LoanController::class, 'showRequest']);
    Route::get('/loan-requests', [LoanController::class, 'indexRequests']);
    Route::post('/loan-requests', [LoanController::class, 'storeRequest']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
        Route::get('/dashboard/charts/loans', [DashboardController::class, 'getLoanChart']);
        Route::get('/dashboard/charts/share-capital', [DashboardController::class, 'getShareCapitalChart']);
        Route::get('/dashboard/recent/loans', [DashboardController::class, 'getRecentLoans']);
        Route::get('/dashboard/recent/transactions', [DashboardController::class, 'getRecentTransactions']);
        Route::get('/dashboard/top-shareholders', [DashboardController::class, 'getTopShareholders']);

    // Admin Only Routes
    Route::middleware('admin')->group(function () {
        Route::prefix('backups')->group(function () {
            Route::get('/', [BackupController::class, 'listBackups']);
            Route::get('/settings', [BackupController::class, 'getSettings']);
            Route::put('/settings', [BackupController::class, 'updateSettings']);
            Route::post('/run', [BackupController::class, 'runManualBackup']);
        });

        Route::get('/admin/users/count', [UserController::class, 'count']);

                // 🚀 REGISTER BULK DELETE FIRST SO IT TAKES PRECEDENCE
                Route::post('/admin/bulk-delete-users', [UserController::class, 'bulkDelete']);
                Route::apiResource('admin/users', UserController::class)->names([
                    'index' => 'api.admin.users.index',
                    'store' => 'api.admin.users.store',
                    'show' => 'api.admin.users.show',
                    'update' => 'api.admin.users.update',
                    'destroy' => 'api.admin.users.destroy',
                ]);
        Route::get('/admin/users/{id}/login-history', [UserController::class, 'loginHistory']);
        Route::post('/admin/users/{id}/impersonate', [UserController::class, 'impersonate']);

        // 🚀 Status & Address Updates
        Route::match(['PUT', 'POST'], '/admin/users/{id}/status', [UserController::class, 'updateStatus']);
        Route::match(['PUT', 'POST'], '/admin/users/{id}/address', [UserController::class, 'updateAddress']);

        // 🚀 Backup Settings Routes
        Route::get('/settings/backup', [BackupController::class, 'getSettings']);
        Route::post('/settings/backup', [BackupController::class, 'updateSettings']);

        // 🚀 Import/Export Routes
        Route::get('/export/{type}/{format}', [\App\Http\Controllers\Api\ImportExportController::class, 'export']);
        Route::post('/import/{type}/preview', [\App\Http\Controllers\Api\ImportExportController::class, 'previewImport']);
        Route::post('/import/{type}/confirm', [\App\Http\Controllers\Api\ImportExportController::class, 'confirmImport']);
        Route::post('/import/error-report', [\App\Http\Controllers\Api\ImportExportController::class, 'downloadErrorReport']);
        Route::post('/import/errors/download', [\App\Http\Controllers\Api\ImportExportController::class, 'downloadErrorReport']);

        Route::post('/activity-logs/cleanup', [ActivityLogController::class, 'cleanup']);
    });

    // Shareholders
    Route::get('/shareholders/count', [ShareholderController::class, 'count']);
    Route::get('/shareholders/user/{userId}', [ShareholderController::class, 'showByUserId']);
    Route::get('/shareholders/email/{email}', [ShareholderController::class, 'showByEmail']);
    Route::get('/shareholders', [ShareholderController::class, 'index']);
    Route::post('/shareholders', [ShareholderController::class, 'store']);
    Route::get('/shareholders/{id}', [ShareholderController::class, 'show']);
    Route::match(['PUT', 'POST'], '/shareholders/{id}', [ShareholderController::class, 'update']);
    Route::match(['PUT', 'POST'], '/shareholders/{id}/capital', [ShareholderController::class, 'updateCapital']);
    Route::delete('/shareholders/{id}', [ShareholderController::class, 'destroy']);

    // Activity Logs
    Route::get('/activity-logs/count', [ActivityLogController::class, 'count']);
    Route::apiResource('activity-logs', ActivityLogController::class)->only(['index', 'store', 'show']);

    // Lending & Interest Settings
    Route::get('/stats/total-disbursed', [LoanController::class, 'getTotalDisbursed']);
    Route::get('/stats/total-capital', [LoanController::class, 'getTotalCapital']);
    Route::get('/stats/active-loans-count', [LoanController::class, 'getActiveLoansCount']);
    Route::get('/lending/metrics', [LoanController::class, 'getMetrics']);
    
    // Interest Rate Routes
    Route::get('/settings/interest-rate', [LoanController::class, 'getInterestRate']);
    Route::post('/settings/interest-rate', [LoanController::class, 'updateInterestRate']);
    Route::get('/settings/interest-rate/history', [LoanController::class, 'getInterestRateHistory']);

    // Loans
    Route::get('/loans/by-request/{requestId}', [LoanController::class, 'showByRequest']);
    Route::get('/loans', [LoanController::class, 'index']);
    Route::get('/loans/{id}/payments', [LoanController::class, 'getPayments']);
    Route::post('/loans/{id}/payments', [LoanController::class, 'recordPayment']);
    Route::get('/loans/{id}', [LoanController::class, 'show']);
    Route::get('/shareholders/{shareholderId}/loans', [LoanController::class, 'getByShareholder']);

    // Consignees
    Route::get('/consignees/search', [ConsigneeController::class, 'search']);
    Route::apiResource('consignees', ConsigneeController::class);

    // Products
    Route::apiResource('products', ProductController::class);
    
    // Transactions
    Route::get('/transactions/count', [TransactionController::class, 'count']);
    Route::get('/transactions/shareholder/{shareholderId}', [TransactionController::class, 'getByShareholder']);
    Route::get('/transactions/reference/{referenceId}', [TransactionController::class, 'getByReference']);
    
    Route::apiResource('transactions', TransactionController::class)->only(['index', 'store']);

    // Notifications & Email
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::match(['PUT', 'POST'], '/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);
    Route::match(['PUT', 'POST'], '/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications', [NotificationController::class, 'destroyAll']);
    Route::post('/send-email', [NotificationController::class, 'sendEmail']);
    // File Upload
    Route::post('/upload', [FileUploadController::class, 'upload']);

});
