<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InterestRateHistory extends Model
{
    protected $table = 'interest_rate_history';
    protected $keyType = 'int';
    public $incrementing = true;

    protected $fillable = [
        'old_rate',
        'new_rate',
        'reason',
        'effective_date',
    ];

    public $timestamps = false; // DB handles created_at
}
