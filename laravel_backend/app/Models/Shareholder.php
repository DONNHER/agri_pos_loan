<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes; // Import the SoftDeletes trait
use App\Traits\Loggable;
use App\Traits\AdvancedDataControls;
use App\Traits\Versionable;

class Shareholder extends Model
{
    use HasFactory, HasUuids, Loggable, AdvancedDataControls, Versionable, SoftDeletes; // Use the SoftDeletes trait

    /**
     * Disable standard Eloquent timestamps.
     * We override the methods to ensure Laravel NEVER tries to use updated_at
     * because the column is missing in the database.
     */
    public $timestamps = false;

    public function getUpdatedAtColumn() { return null; }
    public function getCreatedAtColumn() { return 'created_at'; }

    protected $fillable = [
        'user_id',
        'email',
        'first_name',
        'last_name',
        'full_name',
        'address',
        'contact_number',
        'total_share_capital',
        'creditscore',
        'id_image_url',
        'membership_fee',
        'status',
        'version',
    ];

    protected $casts = [
        'total_share_capital' => 'decimal:2',
        'membership_fee' => 'decimal:2',
        'creditscore' => 'integer',
        'version' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
