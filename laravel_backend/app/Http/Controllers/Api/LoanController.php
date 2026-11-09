<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanRequest;
use App\Models\Transaction;
use App\Models\Shareholder;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\InterestRateHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LoanController extends Controller
{
    /**
     * Display a listing of loans.
     */
    public function index(Request $request)
    {
        $searchable = ['status'];
        
        $query = Loan::with(['shareholder' => function($q) {
            $q->withTrashed()->with(['user' => function($qu) {
                $qu->withTrashed();
            }]);
        }]);
        
        if ($request->boolean('trashed_only')) {
            $query->onlyTrashed();
        } elseif ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        $query->applyControls($request, $searchable);

        if ($request->filled('shareholder_id')) {
            $query->where('shareholder_id', $request->shareholder_id);
        }

        return response()->json(Loan::getPaginatedResponse($query, $request));
    }
public function show($id)
{
    if (!\Illuminate\Support\Str::isUuid($id)) {
        return response()->json([
            'success' => false,
            'message' => 'Loan not found'
        ], 404);
    }

    $loan = Loan::with(['shareholder.user'])->findOrFail($id);
    return response()->json([
        'success' => true,
        'data' => $loan
    ]);
}

public function showByRequest($requestId)
{
    if (!\Illuminate\Support\Str::isUuid($requestId)) {
        return response()->json([
            'success' => false,
            'message' => 'Loan not found'
        ], 404);
    }

    $loan = Loan::with(['shareholder.user'])
        ->where('loan_request_id', $requestId)
        ->firstOrFail();

    return response()->json([
        'success' => true,
        'data' => $loan
    ]);
}

    public function getByShareholder($shareholderId)
    {
        $loans = Loan::where('shareholder_id', $shareholderId)->latest()->get();
        return response()->json([
            'success' => true,
            'data' => $loans
        ]);
    }

    /**
     * Display a listing of loan requests.
     */
    public function indexRequests(Request $request)
    {
        $searchable = ['purpose', 'status', 'rejection_reason'];
        
        $query = LoanRequest::with(['shareholder' => function($q) {
            $q->withTrashed()->with(['user' => function($qu) {
                $qu->withTrashed();
            }]);
        }]);
        
        if ($request->boolean('trashed_only')) {
            $query->onlyTrashed();
        } elseif ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        $query->applyControls($request, $searchable);
        
        if ($request->filled('shareholder_id')) {
            $query->where('shareholder_id', $request->shareholder_id);
        }

        if ($request->filled('comaker_id')) {
            $query->whereJsonContains('loan_comakers', $request->comaker_id);
        }

        return response()->json(LoanRequest::getPaginatedResponse($query, $request));
    }

    public function showRequest($id)
    {
        if (!\Illuminate\Support\Str::isUuid($id)) {
            return response()->json([
                'success' => false,
                'message' => 'Loan request not found'
            ], 404);
        }

        $loanRequest = LoanRequest::with(['shareholder.user'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $loanRequest
        ]);
    }

    public function storeRequest(Request $request)
    {
        $validated = $request->validate([
            'shareholder_id' => 'required|exists:shareholders,id',
            'requested_amount' => 'required|numeric|min:0',
            'interest_rate' => 'required|numeric',
            'months' => 'required|integer',
            'purpose' => 'nullable|string',
            'comaker_ids' => 'required|array|min:2',
        ]);

        $shareholder = Shareholder::findOrFail($validated['shareholder_id']);

        $comakerDecisions = [];
        foreach ($validated['comaker_ids'] as $id) {
            $comakerDecisions[$id] = 'pending';
        }

        $loanRequest = LoanRequest::create([
            'shareholder_id' => $validated['shareholder_id'],
            'requested_amount' => $validated['requested_amount'],
            'interest_rate' => $validated['interest_rate'],
            'months' => $validated['months'],
            'purpose' => $validated['purpose'],
            'status' => 'pending',
            'loan_comakers' => $validated['comaker_ids'],
            'comaker_decisions' => $comakerDecisions,
        ]);

        // 🚀 Create Notification for the Shareholder
        Notification::create([
            'shareholder_id' => $loanRequest->shareholder_id,
            'user_id' => $shareholder->user_id,
            'title' => 'Loan Request Submitted',
            'content' => 'Your loan request for ₱' . number_format($loanRequest->requested_amount, 2) . ' has been submitted successfully and is awaiting review.',
            'category' => 'transaction',
            'type' => 'loan_request_created',
            'is_unread' => true,
            'metadata' => ['loan_request_id' => $loanRequest->id]
        ]);

        // 🚀 Create Notifications for Co-makers
        foreach ($validated['comaker_ids'] as $comakerId) {
            $comaker = Shareholder::find($comakerId);
            Notification::create([
                'shareholder_id' => $comakerId,
                'user_id' => $comaker ? $comaker->user_id : null,
                'title' => 'Co-maker Request',
                'content' => 'You have been requested to be a co-maker for a loan request of ₱' . number_format($loanRequest->requested_amount, 2) . '.',
                'category' => 'transaction',
                'type' => 'comaker_request',
                'is_unread' => true,
                'metadata' => ['loan_request_id' => $loanRequest->id]
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $loanRequest
        ], 201);
    }

    public function setComakerDecision(Request $request, $id)
    {
        $loanRequest = LoanRequest::with('shareholder')->findOrFail($id);
        
        $validated = $request->validate([
            'shareholder_id' => 'required|string',
            'status' => 'required|string',
            'remarks' => 'nullable|string',
        ]);

        $decisions = $loanRequest->comaker_decisions ?? [];
        $decisions[$validated['shareholder_id']] = $validated['status'];
        
        $loanRequest->comaker_decisions = $decisions;
        $loanRequest->save();

        // Optional: Notify the borrower about the decision
        $comaker = Shareholder::find($validated['shareholder_id']);
        $comakerName = $comaker ? $comaker->full_name : 'A co-maker';
        
        Notification::create([
            'shareholder_id' => $loanRequest->shareholder_id,
            'user_id' => $loanRequest->shareholder->user_id,
            'title' => 'Co-maker Update',
            'content' => "$comakerName has " . $validated['status'] . " your co-maker request.",
            'category' => 'transaction',
            'type' => 'loan_status',
            'is_unread' => true,
            'metadata' => ['loan_request_id' => $loanRequest->id]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Decision recorded successfully',
            'data' => $loanRequest
        ]);
    }

    public function disburse(Request $request, $id)
    {
        return DB::transaction(function () use ($id) {
            $loanRequest = LoanRequest::with('shareholder')->findOrFail($id);

            if ($loanRequest->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only approved loan requests can be disbursed.'
                ], 400);
            }

            // Financial Calculations
            $principal = $loanRequest->requested_amount;
            $rate = $loanRequest->interest_rate;
            $months = $loanRequest->months;
            
            $totalInterest = $principal * $rate * $months;
            $totalPayable = $principal + $totalInterest;
            $monthlyInstallment = $totalPayable / $months;

            // 1. Create the Loan Record
            $loan = Loan::create([
                'shareholder_id' => $loanRequest->shareholder_id,
                'loan_request_id' => $loanRequest->id,
                'principal_amount' => $principal,
                'interest_rate' => $rate,
                'tenure_months' => $months,
                'monthly_amortization' => $monthlyInstallment,
                'total_repayable' => $totalPayable,
                'total_amount_to_pay' => $totalPayable,
                'remaining_balance' => $totalPayable,
                'status' => 'active',
                'release_date' => now(),
                'next_repayment_date' => Carbon::now()->addMonths(1),
            ]);

            // 2. Update Loan Request Status
            $loanRequest->update(['status' => 'released']);

            // 3. Create Transaction Record
            Transaction::create([
                'shareholder_id' => $loanRequest->shareholder_id,
                'reference_id' => $loan->id,
                'type' => 'Loan Disbursement',
                'method' => 'Cash',
                'amount' => $principal,
                'status' => 'Successful',
                'date' => now(),
                'description' => 'Disbursement for Loan Request ' . $loanRequest->id,
            ]);

            // 4. Notify Shareholder
            Notification::create([
                'shareholder_id' => $loanRequest->shareholder_id,
                'user_id' => $loanRequest->shareholder->user_id,
                'title' => 'Loan Disbursed!',
                'content' => 'Your loan of ₱' . number_format($principal, 2) . ' has been disbursed successfully.',
                'category' => 'transaction',
                'type' => 'loan_disbursed',
                'is_unread' => true,
                'metadata' => ['loan_id' => $loan->id]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Loan disbursed successfully.',
                'data' => $loan
            ]);
        });
    }

    public function recordPayment(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $loan = Loan::findOrFail($id);
            
            $validated = $request->validate([
                'amount' => 'required|numeric|min:0.01',
                'method' => 'required|string',
                'reference' => 'nullable|string',
            ]);

            $amount = $validated['amount'];
            
            // 1. Create Transaction Record
            $transaction = Transaction::create([
                'shareholder_id' => $loan->shareholder_id,
                'reference_id' => $loan->id,
                'type' => 'Loan Repayment',
                'method' => $validated['method'],
                'amount' => $amount,
                'status' => 'Successful',
                'date' => now(),
                'description' => "Payment for Loan ID: {$loan->id}. Ref: " . ($validated['reference'] ?? 'N/A'),
            ]);

            // 2. Update Loan Balance
            $newBalance = max(0, $loan->remaining_balance - $amount);
            $loan->remaining_balance = $newBalance;
            
            if ($newBalance <= 0) {
                $loan->status = 'fully paid';
            }
            
            $loan->save();

            // 3. Notify Shareholder
            Notification::create([
                'shareholder_id' => $loan->shareholder_id,
                'user_id' => $loan->shareholder->user_id,
                'title' => 'Payment Received',
                'content' => 'A payment of ₱' . number_format($amount, 2) . ' has been recorded for your loan.',
                'category' => 'transaction',
                'type' => 'loan_payment',
                'is_unread' => true,
                'metadata' => ['loan_id' => $loan->id, 'transaction_id' => $transaction->id]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully.',
                'data' => [
                    'loan' => $loan,
                    'transaction' => $transaction
                ]
            ]);
        });
    }

    public function getPayments($id)
    {
        $payments = Transaction::where('reference_id', $id)
            ->where('type', 'Loan Repayment')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    public function updateRequestStatus(Request $request, $id)
    {
        $loanRequest = LoanRequest::with('shareholder')->findOrFail($id);
        $oldStatus = $loanRequest->status;
        
        $validated = $request->validate([
            'status' => 'required|string',
            'rejection_reason' => 'nullable|string',
        ]);

        $loanRequest->update($validated);

        // 🚀 Handle Logic for when a loan is approved (Status: approved or active)
        if ($oldStatus != $loanRequest->status) {
            $statusLabel = ucfirst($loanRequest->status);
            
            Notification::create([
                'shareholder_id' => $loanRequest->shareholder_id,
                'user_id' => $loanRequest->shareholder->user_id,
                'title' => 'Loan Request Update',
                'content' => "Your loan request status has been updated to: $statusLabel.",
                'category' => 'transaction',
                'type' => 'loan_status',
                'is_unread' => true,
                'metadata' => ['loan_request_id' => $loanRequest->id, 'status' => $loanRequest->status]
            ]);

            // If approved, you might also want to notify about disbursement if that happens here
            if (strtolower($loanRequest->status) === 'approved') {
                Notification::create([
                    'shareholder_id' => $loanRequest->shareholder_id,
                    'user_id' => $loanRequest->shareholder->user_id,
                    'title' => 'Loan Approved!',
                    'content' => 'Great news! Your loan request for ₱' . number_format($loanRequest->requested_amount, 2) . ' has been approved.',
                    'category' => 'transaction',
                    'type' => 'loan_approved',
                    'is_unread' => true,
                    'metadata' => ['loan_request_id' => $loanRequest->id]
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $loanRequest
        ]);
    }

    public function countRequests(Request $request)
    {
        $query = LoanRequest::query();
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        return response()->json(['success' => true, 'count' => $query->count()]);
    }

    public function getTotalCapital()
    {
        $total = Shareholder::sum('total_share_capital');
        return response()->json(['success' => true, 'total' => (float)$total]);
    }

    public function getMetrics(Request $request)
    {
        $periodExpr = DB::getDriverName() === 'pgsql' ? "TO_CHAR(date, 'Mon YY')" : "DATE_FORMAT(date, '%b %y')";

        $metrics = Transaction::select(
                DB::raw("$periodExpr as period"),
                DB::raw("SUM(CASE WHEN type LIKE '%Capital%' THEN amount ELSE 0 END) as share_capital"),
                DB::raw("SUM(CASE WHEN type LIKE '%Disbursement%' THEN amount ELSE 0 END) as total_disbursed")
            )
            ->groupBy(DB::raw($periodExpr))
            ->orderBy(DB::raw("MIN(date)"), 'asc')
            ->get();

        return response()->json(['success' => true, 'data' => $metrics]);
    }

    public function getTotalDisbursed()
    {
        $total = Loan::sum('principal_amount');
        return response()->json(['success' => true, 'total' => (float)$total]);
    }

    public function getInterestRate()
    {
        $latest = InterestRateHistory::orderBy('id', 'desc')->first();
        return response()->json([
            'success' => true, 
            'rate' => $latest ? (float)$latest->new_rate : 0.032
        ]);
    }

    public function updateInterestRate(Request $request)
    {
        $validated = $request->validate([
            'old_rate' => 'required|numeric',
            'new_rate' => 'required|numeric',
            'reason' => 'required|string',
            'effective_date' => 'required|date',
        ]);

        $history = InterestRateHistory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Interest rate updated successfully',
            'data' => $history
        ]);
    }

    public function getInterestRateHistory()
    {
        $history = InterestRateHistory::orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }

    public function getActiveLoansCount()
    {
        $count = Loan::where('status', 'active')->count();
        return response()->json(['success' => true, 'count' => $count]);
    }
}
