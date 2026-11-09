<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use App\Traits\Loggable;
use App\Traits\AdvancedDataControls;
use App\Traits\Versionable;

/**
 * Class Product
 * 
 * Represents an item in the inventory catalog.
 * Supports stock tracking via batches and soft-deletion for data integrity.
 */
class Product extends Model
{
    use HasFactory, HasUuids, Loggable, AdvancedDataControls, SoftDeletes, Versionable;

    protected $fillable = [
        'name',
        'description',
        'category',
        'unit',
        'selling_price',
        'status',
        'version',
    ];

    protected $casts = [
        'selling_price' => 'decimal:2',
        'version' => 'integer',
    ];

    /**
     * Relationship: Inventory batches associated with this product.
     */
    public function batches()
    {
        return $this->hasMany(GroceryBatch::class);
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
