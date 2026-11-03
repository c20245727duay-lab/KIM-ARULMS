<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Building extends Model
{
    protected $fillable = ['building_block'];

    public function apartmentUnits(): HasMany
    {
        return $this->hasMany(ApartmentUnit::class);
    }
}