<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lease extends Model
{
    protected $primaryKey = 'lease_id';

    protected $fillable = [
        'tenant_id',
        'apartment_unit_id',
        'monthly_rent',
        'security_deposit',
        'lease_start',
        'lease_end',
    ];

    protected $casts = [
        'lease_start' => 'date',
        'lease_end' => 'date',
        'monthly_rent' => 'decimal:2',
        'security_deposit' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(
            Tenant::class,
            'tenant_id',
            'tenant_id'
        );
    }

    public function apartmentUnit(): BelongsTo
    {
        return $this->belongsTo(
            ApartmentUnit::class,
            'apartment_unit_id',
            'apartment_unit_id'
        );
    }

    public function utilityBills(): HasMany
    {
        return $this->hasMany(
            UtilityBill::class,
            'lease_id',
            'lease_id'
        );
    }
}
