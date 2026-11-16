<?php

namespace Tests\Feature;

use App\Models\ApartmentUnit;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Tenant;
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
        $this->actingAs(User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }

    public function test_dashboard_displays_property_and_active_lease_summary()
    {
        $this->actingAs(User::factory()->create());

        $building = Building::create(['building_block' => 'A']);
        $tenant = Tenant::create([
            'tenant_name' => 'Taylor Tenant',
            'tenant_email' => 'taylor@example.test',
            'tenant_phone' => '1234567890',
        ]);
        $unit = ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_number' => '101',
            'monthly_rent' => 1500,
            'status' => 'Occupied',
        ]);
        ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_number' => '102',
            'monthly_rent' => 1200,
            'status' => 'Vacant',
        ]);
        Lease::create([
            'tenant_id' => $tenant->tenant_id,
            'apartment_unit_id' => $unit->apartment_unit_id,
            'monthly_rent' => 1500,
            'security_deposit' => 1500,
            'lease_start' => today(),
            'lease_end' => today()->addDays(30),
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

    public function test_authenticated_users_can_visit_each_management_section()
    {
        $this->actingAs(User::factory()->create());

        foreach (['/home', '/tenants', '/properties', '/work-orders', '/administration'] as $path) {
            $this->get($path)->assertOk();
        }
    }

    public function test_a_tenant_can_be_added_from_the_tenants_section()
    {
        $this->postJson('/api/tenants', [
            'tenant_name' => 'Jamie Tenant',
            'tenant_email' => 'jamie@example.com',
            'tenant_phone' => '555-0100',
        ])
            ->assertCreated()
            ->assertJsonPath('data.tenant_name', 'Jamie Tenant');

        $this->assertDatabaseHas('tenants', ['tenant_email' => 'jamie@example.com']);
    }

    public function test_a_property_can_be_added_before_creating_its_units()
    {
        $this->postJson('/api/buildings', ['building_block' => 'North Tower'])
            ->assertCreated()
            ->assertJsonPath('data.building_block', 'NORTH TOWER');

        $this->assertDatabaseHas('buildings', ['building_block' => 'NORTH TOWER']);

        $this->postJson('/api/buildings', ['building_block' => 'north tower'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('building_block');
    }

    public function test_apartment_unit_numbers_must_be_unique_per_building()
    {
        $building = Building::create(['building_block' => 'A']);

        ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_name' => 'North View',
            'unit_number' => '101',
            'monthly_rent' => 1200,
            'status' => 'Vacant',
        ]);

        $this->postJson('/api/apartment-units', [
            'building_id' => $building->building_id,
            'unit_name' => 'Garden View',
            'unit_number' => '101',
            'monthly_rent' => 1200,
            'status' => 'Vacant',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('unit_number');
    }

    public function test_apartment_unit_numbers_can_be_updated_without_conflicting_with_the_same_record()
    {
        $building = Building::create(['building_block' => 'A']);
        $unit = ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_name' => 'North View',
            'unit_number' => '101',
            'monthly_rent' => 1200,
            'status' => 'Vacant',
        ]);

        $this->putJson('/api/apartment-units/' . $unit->apartment_unit_id, [
            'building_id' => $building->building_id,
            'unit_name' => 'Updated North View',
            'unit_number' => '101',
            'status' => 'Occupied',
        ])
            ->assertOk()
            ->assertJsonPath('data.unit_name', 'Updated North View')
            ->assertJsonPath('data.unit_number', '101');
    }

    public function test_apartment_unit_status_can_be_updated_with_a_partial_payload()
    {
        $building = Building::create(['building_block' => 'A']);
        $unit = ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_name' => 'North View',
            'unit_number' => '101',
            'monthly_rent' => 1200,
            'status' => 'Vacant',
        ]);

        $this->putJson('/api/apartment-units/' . $unit->apartment_unit_id, [
            'status' => 'Occupied',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'Occupied')
            ->assertJsonPath('data.unit_number', '101');

        $this->assertDatabaseHas('apartment_units', [
            'apartment_unit_id' => $unit->apartment_unit_id,
            'status' => 'Occupied',
            'unit_number' => '101',
        ]);
    }

    public function test_apartment_units_can_include_a_name_and_number()
    {
        $building = Building::create(['building_block' => 'A']);

        $this->postJson('/api/apartment-units', [
            'building_id' => $building->building_id,
            'unit_name' => 'Riverside Suite',
            'unit_number' => '104A',
            'monthly_rent' => 1400,
            'status' => 'Vacant',
        ])
            ->assertCreated()
            ->assertJsonPath('data.unit_name', 'Riverside Suite')
            ->assertJsonPath('data.unit_number', '104A');

        $this->assertDatabaseHas('apartment_units', [
            'building_id' => $building->building_id,
            'unit_name' => 'Riverside Suite',
            'unit_number' => '104A',
        ]);
    }

    public function test_work_orders_can_be_created_and_updated()
    {
        $building = Building::create(['building_block' => 'A']);
        $unit = ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_number' => '101',
            'monthly_rent' => 1200,
            'status' => 'Vacant',
        ]);

        $response = $this->postJson('/api/work-orders', [
            'apartment_unit_id' => $unit->apartment_unit_id,
            'title' => 'Leaking kitchen faucet',
            'description' => 'The faucet is dripping and needs repair.',
            'priority' => 'High',
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'Open')
            ->assertJsonPath('data.apartment_unit.unit_number', '101');

        $this->patchJson('/api/work-orders/'.$response->json('data.id').'/status', [
            'status' => 'In Progress',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'In Progress');

        $this->assertDatabaseHas('work_orders', [
            'title' => 'Leaking kitchen faucet',
            'status' => 'In Progress',
        ]);
    }

    public function test_lease_dates_must_start_today_and_last_at_least_five_days()
    {
        $tenant = Tenant::create([
            'tenant_name' => 'Jamie Tenant',
            'tenant_email' => 'jamie@example.com',
            'tenant_phone' => '555-0100',
        ]);
        $building = Building::create(['building_block' => 'A']);
        $unit = ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_name' => 'Sunset View',
            'unit_number' => '101',
            'monthly_rent' => 1500,
            'status' => 'Vacant',
        ]);

        $this->postJson('/api/leases', [
            'tenant_id' => $tenant->tenant_id,
            'apartment_unit_id' => $unit->apartment_unit_id,
            'monthly_rent' => 1500,
            'security_deposit' => 1500,
            'lease_start' => today()->toDateString(),
            'lease_end' => today()->addDays(4)->toDateString(),
            'utility_charge' => 125,
            'payment_status' => 'Pending',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('lease_end');
    }

    public function test_a_lease_can_be_created_from_the_available_tenants_and_vacant_units()
    {
        $tenant = Tenant::create([
            'tenant_name' => 'Jamie Tenant',
            'tenant_email' => 'jamie@example.com',
            'tenant_phone' => '555-0100',
        ]);
        $building = Building::create(['building_block' => 'A']);
        $unit = ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_name' => 'Sunset View',
            'unit_number' => '101',
            'monthly_rent' => 1500,
            'status' => 'Vacant',
        ]);

        $this->getJson('/api/leases/create')
            ->assertOk()
            ->assertJsonPath('tenants.0.tenant_id', $tenant->tenant_id)
            ->assertJsonPath('vacant_units.0.apartment_unit_id', $unit->apartment_unit_id)
            ->assertJsonPath('vacant_units.0.building.building_block', 'A');

        $this->postJson('/api/leases', [
            'tenant_id' => $tenant->tenant_id,
            'apartment_unit_id' => $unit->apartment_unit_id,
            'monthly_rent' => 1500,
            'security_deposit' => 1500,
            'lease_start' => today()->toDateString(),
            'lease_end' => today()->addDays(5)->toDateString(),
            'utility_charge' => 125,
            'payment_status' => 'Pending',
        ])
            ->assertCreated()
            ->assertJsonPath('data.tenant.tenant_name', 'Jamie Tenant')
            ->assertJsonPath('data.utility_bills.0.total_due', '3125.00');

        $this->assertDatabaseHas('leases', [
            'tenant_id' => $tenant->tenant_id,
            'apartment_unit_id' => $unit->apartment_unit_id,
            'monthly_rent' => 1500,
        ]);
        $this->assertDatabaseHas('apartment_units', [
            'apartment_unit_id' => $unit->apartment_unit_id,
            'status' => 'Occupied',
        ]);
        $this->assertSame(1, Lease::count());
    }

    public function test_apartment_unit_updates_can_use_partial_data()
    {
        $building = Building::create(['building_block' => 'A']);
        $unit = ApartmentUnit::create([
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
