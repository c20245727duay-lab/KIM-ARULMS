<?php

namespace App\Http\Controllers;

use App\Models\ApartmentUnit;
use App\Models\Lease;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $unitCounts = ApartmentUnit::query()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $today = now()->toDateString();
        $activeLeases = Lease::query()
            ->whereDate('lease_start', '<=', $today)
            ->whereDate('lease_end', '>=', $today);

        $stats = [
            'totalUnits' => (int) ApartmentUnit::query()->count(),
            'vacantUnits' => (int) ($unitCounts['Vacant'] ?? 0),
            'occupiedUnits' => (int) ($unitCounts['Occupied'] ?? 0),
            'maintenanceUnits' => (int) ($unitCounts['Maintenance'] ?? 0),
            'monthlyRevenue' => (float) (clone $activeLeases)->sum('monthly_rent'),
            'activeLeases' => (int) (clone $activeLeases)->count(),
        ];

        $recentLeases = Lease::query()
            ->with(['tenant', 'apartmentUnit.building'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(static fn (Lease $lease): array => [
                'lease_id' => $lease->lease_id,
                'tenant_name' => $lease->tenant->tenant_name,
                'building_block' => $lease->apartmentUnit->building->building_block,
                'unit_number' => $lease->apartmentUnit->unit_number,
                'monthly_rent' => (string) $lease->monthly_rent,
                'lease_start' => $lease->lease_start->toDateString(),
                'lease_end' => $lease->lease_end->toDateString(),
            ]);

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentLeases' => $recentLeases,
        ]);
    }
}
