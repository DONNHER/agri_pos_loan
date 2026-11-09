<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PatronageRefund extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'shareholder_id',
        'amount',
        'period',
        'status',
    ];

    public function shareholder()
    {
        return $this->belongsTo(Shareholder::class);
    }
}
