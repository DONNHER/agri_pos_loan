<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use App\Traits\AdvancedDataControls;

/**
 * Class ActivityLog
 * 
 * Central audit trail for the application. 
 * Records authentication events, financial transactions, data changes, and errors.
 */
class ActivityLog extends Model
{
    use HasUuids, AdvancedDataControls;

    // Log Type Constants
    const TYPE_AUTH = 'auth';
    const TYPE_TRANSACTION = 'transaction';
    const TYPE_ERROR = 'error';
    const TYPE_ACCESS = 'access';
    const TYPE_GENERAL = 'general';

    protected $fillable = [
        'user_id',
        'shareholder_id',
        'action',
        'log_type',
        'description',
        'old_values',
        'new_values',
        'stack_trace',
        'ip_address',
        'device_info',
        'is_suspicious',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'is_suspicious' => 'boolean',
        'created_at' => 'datetime',
    ];

    /**
     * @var bool Disables standard timestamps. 'created_at' is handled by DB defaults.
     */
    public $timestamps = false;

    /**
     * Relationship: The system user who performed the action.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Standardize the paginated JSON response structure.
     * Overriding trait method to ensure it's explicitly static to avoid PHP runtime errors.
     */
    public static function getPaginatedResponse(Builder $query, Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 10;
        }

        $paginated = $query->paginate($perPage);

        return [
            'success' => true,
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
            ]
        ];
    }
}
