<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Exception;

/**
 * Trait Versionable
 * 
 * Provides Optimistic Locking capabilities to Eloquent models.
 * It monitors a 'version' column and prevents updates if the version 
 * provided by the client does not match the current version in the database.
 * 
 * @package App\Traits
 */
trait Versionable
{
    /**
     * Boot the Versionable trait.
     * Registers a 'updating' hook to check and increment the version column.
     * 
     * @throws \Exception if a version mismatch (conflict) is detected.
     */
    protected static function bootVersionable()
    {
        static::updating(function ($model) {
            // Get the version that was originally loaded from the DB
            $originalVersion = $model->getOriginal('version');
            
            // Check if the current model instance version matches the DB version
            // If they differ, it means another process updated the record in the meantime
            if ($model->version !== $originalVersion) {
                throw new Exception("Conflict detected: This record has been updated by another user. Please refresh and try again.");
            }
            
            // Increment version on successful update to prepare for the next round
            $model->version = $originalVersion + 1;
        });
    }

    /**
     * Scope for finding a record by ID and a specific Version.
     * Useful for verifying state before performing complex operations.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $version
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithVersion(Builder $query, $version)
    {
        return $query->where('version', $version);
    }
}
