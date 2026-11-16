<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    protected $primaryKey = 'tenant_id';

    protected $fillable = [
        'tenant_name',
        'tenant_email',
        'tenant_phone',
    ];

    public function leases(): HasMany
    {
        return $this->hasMany(Lease::class, 'tenant_id', 'tenant_id');
    }
}
