<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeaseRequest;
use App\Http\Requests\UpdateLeaseRequest;
use App\Models\ApartmentUnit;
use App\Models\Lease;
use App\Models\Tenant;
use App\Services\ApartmentRentalService;

class LeaseController extends Controller
{
    protected ApartmentRentalService $service;

    public function __construct(ApartmentRentalService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        $leases = Lease::with([
            'tenant',
            'apartmentUnit.building',
            'utilityBills',
        ])
            ->latest()
            ->paginate(10);

        return response()->json($leases);
    }

    public function create()
    {
        return response()->json([
            'tenants' => Tenant::all(),
            'vacant_units' => ApartmentUnit::with('building')
                ->where('status', 'Vacant')
                ->get(),
        ]);
    }

    public function store(StoreLeaseRequest $request)
    {
        $lease = $this->service->createLease($request->validated());

        return response()->json([
            'message' => 'Lease created successfully.',
            'data' => $lease,
        ], 201);
    }

    public function update(UpdateLeaseRequest $request, $id)
    {
        $lease = $this->service->updateLease((int) $id, $request->validated());

        return response()->json([
            'message' => 'Lease updated successfully.',
            'data' => $lease,
        ]);
    }
}
