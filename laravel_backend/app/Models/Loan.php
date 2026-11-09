<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Loggable;
use App\Traits\AdvancedDataControls;
use App\Traits\Versionable;

class Loan extends Model
{
    use HasFactory, HasUuids, Loggable, AdvancedDataControls, SoftDeletes, Versionable;

    protected $fillable = [
        'shareholder_id',
        'loan_request_id',
        'principal_amount',
        'interest_rate',
        'tenure_months',         // Changed from term_months
        'monthly_amortization',  // Changed from monthly_installment
        'total_repayable',       // Changed from total_payable
        'remaining_balance',
        'status',
        'next_repayment_date',   // Changed from due_date
        'release_date',          // Changed from disbursed_at
        'processing_fee',
        'total_amount_to_pay',
        'version',
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'monthly_amortization' => 'decimal:2',
        'total_repayable' => 'decimal:2',
        'remaining_balance' => 'decimal:2',
        'next_repayment_date' => 'date',
        'release_date' => 'datetime',
        'version' => 'integer',
    ];

    public function shareholder()
    {
        return $this->belongsTo(Shareholder::class);
    }
}
