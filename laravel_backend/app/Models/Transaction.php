<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
// Removed SoftDeletes as the column 'deleted_at' does not exist in the transactions table
use App\Traits\Loggable;
use App\Traits\AdvancedDataControls;
use App\Traits\Versionable;

/**
 * Class Transaction
 * 
 * Represents a financial movement in the system ledger.
 */
class Transaction extends Model
{
    use Loggable, AdvancedDataControls, Versionable;

    protected $table = 'transactions';
    protected $keyType = 'int';
    public $incrementing = true;
    
    /**
     * Disable standard Eloquent timestamps.
     * We override the methods to ensure Laravel uses 'date' for sorting
     * and doesn't look for 'created_at' or 'updated_at'.
     */
    public $timestamps = false;

    // This ensures AdvancedDataControls scopeApplyControls uses 'date' for default sorting
    public function getCreatedAtColumn() { return 'date'; }
    public function getUpdatedAtColumn() { return null; }

    protected $fillable = [
        'reference_id',
        'shareholder_id',
        'type',
        'method',
        'amount',
        'status',
        'date',
        'version',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'version' => 'integer',
        'date' => 'datetime',
    ];

    /**
     * Relationship: The shareholder associated with this transaction.
     */
    public function shareholder()
    {
        return $this->belongsTo(Shareholder::class);
    }
}
