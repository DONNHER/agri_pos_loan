<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Loggable;
use App\Traits\AdvancedDataControls;
use App\Traits\Versionable;

/**
 * Class Consignee
 * 
 * Represents an external partner or agent who receives goods for sale 
 * on behalf of the cooperative.
 */
class Consignee extends Model
{
    use HasUuids, Loggable, AdvancedDataControls, SoftDeletes, Versionable;

    protected $fillable = [
        'full_name',
        'phone',
        'address',
        'version',
    ];

    protected $casts = [
        'version' => 'integer',
    ];

    /**
     * @var bool Timestamps are enabled to track creation, updates, and soft deletions.
     */
    public $timestamps = true;
}
