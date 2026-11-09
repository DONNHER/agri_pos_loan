<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class GroceryBatch
 * 
 * Represents a specific inventory purchase/delivery of a product.
 * Tracks purchase costs, expiration dates, and remaining stock quantity.
 * 
 * @package App\Models
 */
class GroceryBatch extends Model
{
    /**
     * @var string Primary key type.
     */
    protected $keyType = 'int';
    
    /**
     * @var bool Auto-incrementing ID.
     */
    public $incrementing = true;

    protected $fillable = [
        'product_id',
        'capital_price',
        'original_quantity',
        'remaining_quantity',
        'purchase_date',
        'expiration_date',
    ];

    /**
     * @var bool Disables standard timestamps; dates are manually managed.
     */
    public $timestamps = false;

    /**
     * Relationship: The product catalog entry this batch belongs to.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
