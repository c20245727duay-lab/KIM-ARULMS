<?php

use App\Http\Controllers\ApartmentUnitController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\LeaseController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\WorkOrderController;
use Illuminate\Support\Facades\Route;

Route::post('/buildings', [BuildingController::class, 'store']);
Route::post('/tenants', [TenantController::class, 'store']);

Route::get('/apartment-units/create', [ApartmentUnitController::class, 'create']);
Route::apiResource('apartment-units', ApartmentUnitController::class)
    ->only(['index', 'store', 'update']);

Route::get('/leases/create', [LeaseController::class, 'create']);
Route::apiResource('leases', LeaseController::class)
    ->only(['index', 'store', 'update']);

Route::post('/work-orders', [WorkOrderController::class, 'store']);
Route::patch('/work-orders/{workOrder}/status', [WorkOrderController::class, 'updateStatus']);
