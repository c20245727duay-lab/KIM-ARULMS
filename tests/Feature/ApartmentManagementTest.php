<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApartmentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_management_pages_require_authentication_and_render()
    {
        $this->get('/apartment-units')->assertRedirect('/login');
        $this->get('/leases')->assertRedirect('/login');

        $this->actingAs(User::factory()->create());

        $this->get('/apartment-units')
            ->assertInertia(fn ($page) => $page->component('apartment-units'));

        $this->get('/leases')
            ->assertInertia(fn ($page) => $page->component('leases'));
    }

    public function test_building_and_tenant_creation_uses_service_normalization()
    {
        $this->postJson('/api/buildings', [
            'building_block' => ' block a ',
        ])
            ->assertCreated()
            ->assertJsonPath('data.building_block', 'BLOCK A');

        $this->postJson('/api/buildings', [
            'building_block' => 'block a',
        ])->assertUnprocessable();

        $this->postJson('/api/tenants', [
            'tenant_name' => 'Jordan Tenant',
            'tenant_email' => 'jordan@example.test',
            'tenant_phone' => '(555) 123-4567',
        ])
            ->assertCreated()
            ->assertJsonPath('data.tenant_phone', '5551234567');
    }

    public function test_lease_creation_bills_the_correct_total_and_occupies_the_unit()
    {
        $building = \App\Models\Building::create([
            'building_block' => 'A',
        ]);
        $tenant = \App\Models\Tenant::create([
            'tenant_name' => 'Jordan Tenant',
            'tenant_email' => 'jordan@example.test',
            'tenant_phone' => '5551234567',
        ]);
        $unit = \App\Models\ApartmentUnit::create([
            'building_id' => $building->building_id,
            'unit_number' => '101',
            'monthly_rent' => 1200,
            'status' => 'Vacant',
        ]);

        $this->postJson('/api/leases', [
            'tenant_id' => $tenant->tenant_id,
            'apartment_unit_id' => $unit->apartment_unit_id,
            'monthly_rent' => 1200,
            'security_deposit' => 1200,
            'lease_start' => today()->toDateString(),
            'lease_end' => today()->addDays(30)->toDateString(),
            'utility_charge' => 100,
            'payment_status' => 'Pending',
        ])->assertCreated();

        $this->assertDatabaseHas('apartment_units', [
            'apartment_unit_id' => $unit->apartment_unit_id,
            'status' => 'Occupied',
        ]);
        $this->assertDatabaseHas('utility_bills', [
            'utility_charge' => 100,
            'total_due' => 2500,
            'payment_status' => 'Pending',
        ]);

        $lease = \App\Models\Lease::query()->firstOrFail();
        $this->putJson('/api/leases/'.$lease->lease_id, [
            'payment_status' => 'Paid',
        ])->assertOk();

        $this->assertDatabaseHas('utility_bills', [
            'lease_id' => $lease->lease_id,
            'utility_charge' => 100,
            'total_due' => 2500,
            'payment_status' => 'Paid',
        ]);
    }
}
