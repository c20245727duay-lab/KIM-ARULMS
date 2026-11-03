<?php

namespace App\Http\Controllers;

use App\Models\Lease;
use App\Models\ApartmentUnit;
use App\Http\Requests\StoreLeaseRequest;
use App\Http\Requests\UpdateLeaseRequest;
use App\Services\ApartmentRentalService;

class LeaseController extends Controller
{
    public function __construct(
        private ApartmentRentalService $service
    ) {}

    public function index()
    {
        $leases = Lease::with([
            'tenant',
            'apartmentUnit.building',
            'utilityBill',
        ])->latest()->paginate(10);

        return response()->json($leases);
    }

    public function create()
    {
        return response()->json([
            'vacant_units' => ApartmentUnit::with('building')
                ->where('status', 'Vacant')
                ->get(),
            'payment_statuses' => ['Unpaid', 'Paid', 'Partial'],
        ]);
    }

    public function store(StoreLeaseRequest $request)
    {
        $lease = $this->service->createLease(
            $request->validated()
        );

        return response()->json([
            'message' => 'Lease created successfully.',
            'data' => $lease,
        ], 201);
    }

    public function update(
        UpdateLeaseRequest $request,
        string $id
    ) {
        $lease = $this->service->updateLease(
            $request->validated(),
            (int) $id
        );

        return response()->json([
            'message' => 'Lease updated successfully.',
            'data' => $lease,
        ]);
    }
}