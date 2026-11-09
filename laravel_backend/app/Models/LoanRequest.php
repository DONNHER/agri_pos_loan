<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Loggable;
use App\Traits\AdvancedDataControls;
use App\Traits\Versionable;

/**
 * Class LoanRequest
 * 
 * Represents an initial application for a loan by a shareholder.
 */
class LoanRequest extends Model
{
    use HasFactory, HasUuids, Loggable, AdvancedDataControls, SoftDeletes, Versionable;

    protected $fillable = [
        'shareholder_id',
        'requested_amount',
        'interest_rate',
        'months',
        'purpose',
        'status',
        'loan_comakers',
        'comaker_decisions',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'version',
    ];

    protected $casts = [
        'requested_amount' => 'decimal:2',
        'interest_rate' => 'double',
        'months' => 'integer',
        'loan_comakers' => 'array',
        'comaker_decisions' => 'array',
        'reviewed_at' => 'datetime',
        'version' => 'integer',
    ];

    /**
     * Relationship: The shareholder who is requesting the loan.
     */
    public function shareholder()
    {
        return $this->belongsTo(Shareholder::class)->withTrashed();
    }
}
