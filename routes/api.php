<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ApartmentUnitController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\LeaseController;
use App\Http\Controllers\TenantController;

Route::post('/buildings', [BuildingController::class, 'store']);
Route::post('/tenants', [TenantController::class, 'store']);

// APARTMENT UNIT ROUTES

Route::get('/apartment-units', [
    ApartmentUnitController::class,
    'index'
]);

Route::get('/apartment-units/create', [
    ApartmentUnitController::class,
    'create'
]);

Route::post('/apartment-units', [
    ApartmentUnitController::class,
    'store'
]);

Route::put('/apartment-units/{id}', [
    ApartmentUnitController::class,
    'update'
]);


// LEASE ROUTES

Route::get('/leases', [
    LeaseController::class,
    'index'
]);

Route::get('/leases/create', [
    LeaseController::class,
    'create'
]);

Route::post('/leases', [
    LeaseController::class,
    'store'
]);

Route::put('/leases/{id}', [
    LeaseController::class,
    'update'
]);