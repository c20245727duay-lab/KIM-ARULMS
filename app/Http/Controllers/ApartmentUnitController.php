<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApartmentUnitRequest;
use App\Http\Requests\UpdateApartmentUnitRequest;
use App\Models\ApartmentUnit;
use App\Models\Building;
use App\Services\ApartmentRentalService;

class ApartmentUnitController extends Controller
{
    protected ApartmentRentalService $service;

    public function __construct(ApartmentRentalService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        $units = ApartmentUnit::with(['building', 'leases.tenant'])
            ->latest()
            ->paginate(10);

        return response()->json($units);
    }

    public function create()
    {
        return response()->json([
            'buildings' => Building::all(),
            'statuses' => ['Vacant', 'Occupied', 'Maintenance'],
        ]);
    }

    public function store(StoreApartmentUnitRequest $request)
    {
        $unit = $this->service->createApartmentUnit($request->validated());

        return response()->json([
            'message' => 'Apartment unit created successfully.',
            'data' => $unit->load('building'),
        ], 201);
    }

    public function update(UpdateApartmentUnitRequest $request, string $id)
    {
        $unit = $this->service->updateApartmentUnit((int) $id, $request->validated());

        return response()->json([
            'message' => 'Apartment unit updated successfully.',
            'data' => $unit,
        ]);
    }
}
