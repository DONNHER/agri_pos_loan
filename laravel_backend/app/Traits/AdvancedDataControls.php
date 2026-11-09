<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * Trait AdvancedDataControls
 * 
 * Provides standardized data management methods for Eloquent models, 
 * including dynamic searching, multi-column filtering, flexible sorting, 
 * and consistent pagination responses.
 */
trait AdvancedDataControls
{
    /**
     * Apply advanced controls (Search, Filter, Sort, Columns) to an Eloquent query.
     */
    public function scopeApplyControls($query, $request, array $searchableColumns = [])
    {
        // 1. Column Selection
        if ($request instanceof Request && $request->filled('columns')) {
            $columns = explode(',', $request->columns);
            $pk = $this->getKeyName();
            if (!in_array($pk, $columns)) {
                $columns[] = $pk;
            }
            $query->select($columns);
        }

        // 2. Global Search
        if ($request instanceof Request && $request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search, $searchableColumns) {
                foreach ($searchableColumns as $column) {
                    if (str_contains($column, '.')) {
                        [$relation, $relColumn] = explode('.', $column);
                        $q->orWhereHas($relation, function($subQuery) use ($relColumn, $search) {
                            $subQuery->where($relColumn, 'like', "%{$search}%");
                        });
                    } else {
                        $q->orWhere($column, 'like', "%{$search}%");
                    }
                }
            });
        }

        // 3. Dynamic Sorting
        if ($request instanceof Request) {
            $sortColumn = $request->get('sort_by', $this->getCreatedAtColumn() ?? $this->getKeyName());
            $sortDirection = $request->get('sort_order', 'desc');
            $sortDirection = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'desc';
            $query->orderBy($sortColumn, $sortDirection);
        }

        // 4. Standard Filters
        if ($request instanceof Request) {
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('role')) {
                $query->where('role', $request->role);
            }
        }

        return $query;
    }

    /**
     * Standardize the paginated JSON response structure.
     * MUST BE STATIC.
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
