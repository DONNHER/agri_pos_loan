<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use App\Traits\Loggable;
use App\Traits\AdvancedDataControls;

class Notification extends Model
{
    use HasUuids, Loggable, AdvancedDataControls;

    protected $fillable = [
        'user_id',
        'shareholder_id',
        'comaker_id',
        'title',
        'content',
        'category',
        'type',
        'is_unread',
        'metadata',
    ];

    protected $casts = [
        'is_unread' => 'boolean',
        'metadata' => 'array',
    ];

    public $timestamps = false; // DB handles created_at

    /**
     * Standardize the paginated JSON response structure.
     * Explicitly static to avoid PHP runtime errors during trait resolution.
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
