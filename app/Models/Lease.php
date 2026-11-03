<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lease extends Model
{
    protected $fillable = [
        'tenant_id',
        'apartment_unit_id',
        'security_deposit',
        'lease_start',
        'lease_end',
        'payment_status',
    ];

    protected function casts(): array
    {
        return [
            'security_deposit' => 'decimal:2',
            'lease_start' => 'date',
            'lease_end' => 'date',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function apartmentUnit(): BelongsTo
    {
        return $this->belongsTo(ApartmentUnit::class);
    }

    public function utilityBill(): HasOne
    {
        return $this->hasOne(UtilityBill::class);
    }
}