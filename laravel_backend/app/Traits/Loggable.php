<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Trait Loggable
 * 
 * Automatically tracks and logs CRUD operations (Created, Updated, Deleted, Restored) 
 * for any model that uses this trait. It captures changes (old vs new values), 
 * user information, and technical metadata like IP and User Agent.
 * 
 * @package App\Traits
 */
trait Loggable
{
    /**
     * Boot the Loggable trait.
     * Registers model hooks to trigger activity logging during the model lifecycle.
     */
    protected static function bootLoggable()
    {
        // Log when a new record is created
        static::created(function ($model) {
            static::logActivity($model, 'Created', null, $model->getAttributes());
        });

        // Log when an existing record is updated
        static::updated(function ($model) {
            // Filter only the attributes that were actually changed
            $oldValues = array_intersect_key($model->getOriginal(), $model->getChanges());
            $newValues = $model->getChanges();
            
            // Security: Don't log actual password values in the database logs
            if (isset($newValues['password'])) {
                $newValues['password'] = '[REDACTED]';
                $oldValues['password'] = '[REDACTED]';
            }

            static::logActivity($model, 'Updated', $oldValues, $newValues);
        });

        // Log when a record is deleted (handles both Soft and Force deletes)
        static::deleted(function ($model) {
            $action = method_exists($model, 'isForceDeleting') && $model->isForceDeleting() 
                ? 'Force Deleted' 
                : 'Soft Deleted';
            static::logActivity($model, $action, $model->getAttributes(), null);
        });

        // Log when a soft-deleted record is restored
        if (method_exists(static::class, 'restored')) {
            static::restored(function ($model) {
                static::logActivity($model, 'Restored', null, $model->getAttributes());
            });
        }
    }

    /**
     * Internal helper to create the ActivityLog entry.
     * 
     * @param \Illuminate\Database\Eloquent\Model $model The model being acted upon.
     * @param string $action The action performed (Created, Updated, etc.)
     * @param array|null $old The state of attributes before the action.
     * @param array|null $new The state of attributes after the action.
     */
    protected static function logActivity($model, $action, $old = null, $new = null)
    {
        $modelName = class_basename($model);

        // 🚀 OPTIMIZATION: Skip logging for specific actions/models as requested
        // 1. Remove "Updated User" logs
        if ($action === 'Updated' && $modelName === 'User') {
            return;
        }

        // 2. Remove automatic logging for Transaction model entirely to reduce DB bloat
        if ($modelName === 'Transaction') {
            return;
        }

        ActivityLog::create([
            'user_id' => Auth::id(),
            'shareholder_id' => $modelName === 'Shareholder' ? $model->id : ($model->shareholder_id ?? null),
            'action' => $action . ' ' . $modelName,
            'log_type' => ActivityLog::TYPE_TRANSACTION,
            'description' => $action . " record in " . $model->getTable() . " (ID: {$model->id})",
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => Request::ip(),
            'device_info' => Request::userAgent(),
        ]);
    }
}
