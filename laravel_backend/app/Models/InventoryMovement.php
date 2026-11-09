<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasUuids;

    protected $fillable = ['product_id', 'quantity', 'type', 'reason'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
