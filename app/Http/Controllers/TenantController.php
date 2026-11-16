<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTenantRequest;
use App\Services\ApartmentRentalService;

class TenantController extends Controller
{
    public function store(StoreTenantRequest $request, ApartmentRentalService $service)
    {
        $tenant = $service->createTenant($request->validated());

        return response()->json([
            'message' => 'Tenant created successfully.',
            'data' => $tenant,
        ], 201);
    }
}
