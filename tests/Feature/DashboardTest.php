<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }

    public function test_dashboard_displays_property_and_active_lease_summary()
    {
        $this->actingAs(User::factory()->create());

        $building = \App\Models\Building::create([
            'building_block' => 'A',
        ]);
        $tenant = \App\Models\Tenant::create([
            'tenant_name' => 'Taylor Tenant',
            'tenant_email' => 'taylor@example.test',
            'tenant_phone' => '1234567890',
        ]);
        $unit = \App\Models\ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_number' => '101',
            'monthly_rent' => 1500,
            'status' => 'Occupied',
        ]);
        \App\Models\ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_number' => '102',
            'monthly_rent' => 1200,
            'status' => 'Vacant',
        ]);
        \App\Models\Lease::create([
            'tenant_id' => $tenant->tenant_id,
            'apartment_unit_id' => $unit->apartment_unit_id,
            'monthly_rent' => 1500,
            'security_deposit' => 1500,
            'lease_start' => now()->subDay()->toDateString(),
            'lease_end' => now()->addDay()->toDateString(),
        ]);

        $this->get('/dashboard')->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('stats.totalUnits', 2)
            ->where('stats.occupiedUnits', 1)
            ->where('stats.vacantUnits', 1)
            ->where('stats.monthlyRevenue', 1500)
            ->where('stats.activeLeases', 1)
            ->where('recentLeases.0.tenant_name', 'Taylor Tenant'));
    }

    public function test_apartment_unit_updates_can_use_partial_data()
    {
        $this->actingAs(User::factory()->create());

        $building = \App\Models\Building::create([
            'building_block' => 'A',
        ]);

        $unit = \App\Models\ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_number' => '101',
            'monthly_rent' => 1200,
            'status' => 'Vacant',
        ]);

        $this->putJson('/api/apartment-units/'.$unit->apartment_unit_id, [
            'unit_number' => '101A',
        ])
            ->assertOk()
            ->assertJsonPath('data.unit_number', '101A');

        $this->assertDatabaseHas('apartment_units', [
            'apartment_unit_id' => $unit->apartment_unit_id,
            'unit_number' => '101A',
        ]);
    }
}
