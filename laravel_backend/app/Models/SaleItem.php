<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Class SaleItem
 * 
 * Represents a single product line within a larger sales transaction.
 * Tracks the quantity sold and the price at the time of the sale.
 * 
 * @package App\Models
 */
class SaleItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'sale_id',
        'product_id',
        'quantity',
        'selling_price',
    ];

    /**
     * Relationship: The parent sale record.
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Relationship: The product that was sold.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
