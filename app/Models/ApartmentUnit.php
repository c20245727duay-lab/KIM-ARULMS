<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApartmentUnit extends Model
{
    protected $primaryKey = 'apartment_unit_id';

    protected $fillable = [
        'building_id',
        'unit_name',
        'unit_number',
        'monthly_rent',
        'status',
    ];

    public function building(): BelongsTo
    {
        return $this->belongsTo(
            Building::class,
            'building_id',
            'building_id'
        );
    }
    public function leases(): HasMany
    {
        return $this->hasMany(
            Lease::class,
            'apartment_unit_id',
            'apartment_unit_id'
        );
    }
}
