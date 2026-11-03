<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UtilityBill extends Model
{
    protected $fillable = [
        'lease_id',
        'utility_charge',
        'total_due',
    ];

    protected function casts(): array
    {
        return [
            'utility_charge' => 'decimal:2',
            'total_due' => 'decimal:2',
        ];
    }

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class);
    }
}