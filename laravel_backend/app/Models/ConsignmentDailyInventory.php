<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ConsignmentDailyInventory extends Model
{
    use HasUuids;

    protected $table = 'consignment_daily_inventory';

    protected $fillable = [
        'product_id',
        'consingment_date',
        'quantity_received',
        'quantity_sold',
    ];

    public $timestamps = false;

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
