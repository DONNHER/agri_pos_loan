<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ShareCapital extends Model
{
    use HasUuids;

    // Matches your table name exactly
    protected $table = 'share_capitals';

    protected $fillable = [
        'shareholder_id',
        'amount',
    ];

    public $timestamps = false; // DB handles created_at
}
