<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOrder extends Model
{
    protected $fillable = [
        'apartment_unit_id',
        'title',
        'description',
        'priority',
        'status',
    ];

    public function apartmentUnit(): BelongsTo
    {
        return $this->belongsTo(
            ApartmentUnit::class,
            'apartment_unit_id',
            'apartment_unit_id'
        );
    }
}
