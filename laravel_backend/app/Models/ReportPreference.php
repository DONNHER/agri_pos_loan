<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportPreference extends Model
{
    protected $fillable = ['user_id', 'name', 'report_type', 'format', 'filters'];

    protected $casts = [
        'filters' => 'array',
    ];
}
