<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UtilityBill extends Model
{
    protected $primaryKey = 'utility_bill_id';

    protected $fillable = [
        'lease_id',
        'utility_charge',
        'total_due',
        'payment_status',
    ];

    protected $casts = [
        'utility_charge' => 'decimal:2',
        'total_due' => 'decimal:2',
    ];

    public function lease(): BelongsTo
    {
        return $this->belongsTo(
            Lease::class,
            'lease_id',
            'lease_id'
        );
    }
}
