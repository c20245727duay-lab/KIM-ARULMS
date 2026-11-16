<?php

use App\Http\Controllers\DashboardController;
use App\Models\ApartmentUnit;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Tenant;
use App\Models\WorkOrder;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('apartment-units', fn () => Inertia::render('apartment-units'))
        ->name('apartment-units.index');
    Route::get('leases', fn () => Inertia::render('leases'))
        ->name('leases.index');

    $renderManagementSection = function (string $section) {
        $today = now()->toDateString();
        $activeLeases = Lease::query()
            ->whereDate('lease_start', '<=', $today)
            ->whereDate('lease_end', '>=', $today);

        $props = [
            'section' => $section,
            'summary' => [
                'activeLeases' => (clone $activeLeases)->count(),
                'occupiedUnits' => ApartmentUnit::where('status', 'Occupied')->count(),
                'totalUnits' => ApartmentUnit::count(),
                'monthlyRent' => (clone $activeLeases)->sum('monthly_rent'),
                'tenantCount' => Tenant::count(),
                'openWorkOrders' => WorkOrder::where('status', '!=', 'Completed')->count(),
            ],
        ];

        if ($section === 'tenants') {
            $props['tenants'] = Tenant::withCount('leases')->latest()->get();
        }

        if ($section === 'properties' || $section === 'work-orders') {
            $props['buildings'] = Building::orderBy('building_block')->get();
            $props['units'] = ApartmentUnit::with('building')
                ->orderBy('building_id')
                ->orderBy('unit_number')
                ->get();
        }

        if ($section === 'work-orders') {
            $props['workOrders'] = WorkOrder::with('apartmentUnit.building')
                ->latest()
                ->get();
        }

        return Inertia::render('management', $props);
    };

    Route::get('home', fn () => $renderManagementSection('home'))->name('home.dashboard');
    Route::get('tenants', fn () => $renderManagementSection('tenants'))->name('tenants.index');
    Route::get('properties', fn () => $renderManagementSection('properties'))->name('properties.index');
    Route::get('work-orders', fn () => $renderManagementSection('work-orders'))->name('work-orders.index');
    Route::get('administration', fn () => $renderManagementSection('administration'))->name('administration');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
