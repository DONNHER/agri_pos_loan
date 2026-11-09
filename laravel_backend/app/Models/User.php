<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Loggable;
use App\Traits\AdvancedDataControls;
use App\Traits\Versionable;
use Carbon\Carbon;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids, Loggable, AdvancedDataControls, SoftDeletes, Versionable;

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_SUSPENDED = 'suspended';

    const ROLE_ADMIN = 'admin';
    const ROLE_STAFF = 'staff';
    const ROLE_MEMBER = 'member';
    const ROLE_MANAGER = 'manager';

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = true;

    protected $fillable = [
        'username',
        'email',
        'password',
        'firstname',
        'lastname',
        'role',
        'status',
        'avatar_url',
        'address',
        'failed_attempts',
        'locked_until',
        'mfa_code',
        'mfa_expires_at',
        'mfa_enabled',
        'version',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'mfa_code',
    ];

    protected $casts = [
        'locked_until' => 'datetime',
        'mfa_expires_at' => 'datetime',
        'mfa_enabled' => 'boolean',
        'version' => 'integer',
    ];

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function shareholder()
    {
        return $this->hasOne(Shareholder::class, 'user_id');
    }
}
