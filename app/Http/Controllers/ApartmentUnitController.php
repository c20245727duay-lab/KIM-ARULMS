<?php

namespace App\Http\Controllers;

use App\Models\ApartmentUnit;
use App\Models\Building;
use App\Http\Requests\StoreApartmentUnitRequest;
use App\Http\Requests\UpdateApartmentUnitRequest;
use App\Services\ApartmentRentalService;

class ApartmentUnitController extends Controller
{
    public function __construct(
        private ApartmentRentalService $service
    ) {}

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
        $unit = $this->service->createApartmentUnit(
            $request->validated()
        );

        return response()->json([
            'message' => 'Apartment unit created successfully.',
            'data' => $unit->load('building'),
        ], 201);
    }

    public function update(
        UpdateApartmentUnitRequest $request,
        string $id
    ) {
        $unit = $this->service->updateApartmentUnit(
            $request->validated(),
            (int) $id
        );

        return response()->json([
            'message' => 'Apartment unit updated successfully.',
            'data' => $unit,
        ]);
    }
}