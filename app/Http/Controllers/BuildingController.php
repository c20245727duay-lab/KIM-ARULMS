<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBuildingRequest;
use App\Services\ApartmentRentalService;

class BuildingController extends Controller
{
    public function store(StoreBuildingRequest $request, ApartmentRentalService $service)
    {
        $building = $service->createBuilding($request->validated());

        return response()->json([
            'message' => 'Building created successfully.',
            'data' => $building,
        ], 201);
    }
}
