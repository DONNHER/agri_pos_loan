<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Grocery
 * 
 * Specifically tracks grocery-type products. 
 * Acts as a subtype or extension of the base Product model.
 * 
 * @package App\Models
 */
class Grocery extends Model
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
    ];

    /**
     * @var bool Standard timestamps are disabled.
     */
    public $timestamps = false;

    /**
     * Relationship: The base product catalog entry.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
