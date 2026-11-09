<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consignment extends Model
{
    // Your schema uses bigint for consignments
    protected $keyType = 'int';
    public $incrementing = true;

    protected $fillable = [
        'product_id',
        'consignee_id',
        'commission_rate',
        'capital_price',
    ];

    public $timestamps = false;

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function consignee()
    {
        return $this->belongsTo(Consignee::class);
    }
}
