<?php

namespace Database\Seeders;

use App\Models\ApartmentUnit;
use App\Models\Building;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ManagementSampleDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            foreach ([
                [
                    'tenant_name' => 'Maria Santos',
                    'tenant_email' => 'maria.santos.renter@gmail.com',
                    'tenant_phone' => '09171230001',
                ],
                [
                    'tenant_name' => 'Carlo Reyes',
                    'tenant_email' => 'carlo.reyes.renter@gmail.com',
                    'tenant_phone' => '09171230002',
                ],
                [
                    'tenant_name' => 'Ana Cruz',
                    'tenant_email' => 'ana.cruz.renter@gmail.com',
                    'tenant_phone' => '09171230003',
                ],
            ] as $tenant) {
                Tenant::firstOrCreate(
                    ['tenant_email' => $tenant['tenant_email']],
                    $tenant
                );
            }

            $building = Building::firstOrCreate([
                'building_block' => 'BLOCK A',
            ]);

            ApartmentUnit::firstOrCreate(
                [
                    'building_id' => $building->building_id,
                    'unit_number' => '102',
                ],
                ['status' => 'Vacant']
            );
        });
    }
}
