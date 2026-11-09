<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;

/**
 * Class Sale
 * 
 * Represents a completed sales transaction at the point of sale. 
 * Tracks the cashier who performed the sale, the shareholder (if applicable),
 * and the payment method used.
 * 
 * @package App\Models
 */
class Sale extends Model
{
    use HasUuids, Loggable;

    protected $fillable = [
        'id',
        'cashier_id',
        'shareholder_id',
        'payment_type',
    ];

    /**
     * Relationship: The specific line items (products and quantities) in this sale.
     */
    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Relationship: The staff user who processed the sale.
     */
    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    /**
     * Relationship: The shareholder who made the purchase (for patronage refund tracking).
     */
    public function shareholder()
    {
        return $this->belongsTo(Shareholder::class);
    }
}
