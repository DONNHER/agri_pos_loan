<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InterestSetting extends Model
{
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'rate',
        'is_active',
    ];

    public $timestamps = false; // Your schema uses DB default for updated_at
}
