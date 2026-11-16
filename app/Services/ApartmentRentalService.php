<?php

namespace App\Services;

use App\Models\ApartmentUnit;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Tenant;
use App\Models\UtilityBill;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApartmentRentalService
{
    private function cleanText($value)
    {
        return trim(strip_tags($value));
    }

    private function cleanPhone($phone)
    {
        return preg_replace('/[^0-9+]/', '', $phone);
    }

    private function money($amount)
    {
        return round((float) $amount, 2);
    }

    public function createTenant(array $data)
    {
        return DB::transaction(function () use ($data) {
            return Tenant::create([
                'tenant_name' => $this->cleanText($data['tenant_name']),
                'tenant_email' => trim($data['tenant_email']),
                'tenant_phone' => $this->cleanPhone($data['tenant_phone']),
            ]);
        });
    }

    public function createBuilding(array $data)
    {
        return DB::transaction(function () use ($data) {
            return Building::create([
                'building_block' => strtoupper($this->cleanText($data['building_block'])),
            ]);
        });
    }

    public function createApartmentUnit(array $data)
    {
        return DB::transaction(function () use ($data) {
            return ApartmentUnit::create([
                'building_id' => $data['building_id'],
                'unit_name' => isset($data['unit_name']) ? $this->cleanText($data['unit_name']) : null,
                'unit_number' => $this->cleanText($data['unit_number']),
                'monthly_rent' => $this->money($data['monthly_rent'] ?? 0),
                'status' => $data['status'],
            ]);
        });
    }

    public function updateApartmentUnit($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $unit = ApartmentUnit::findOrFail($id);
            $payload = [];

            if (array_key_exists('building_id', $data)) {
                $payload['building_id'] = $data['building_id'];
            }

            if (array_key_exists('unit_name', $data)) {
                $name = $data['unit_name'];
                $payload['unit_name'] = is_string($name) && trim($name) !== ''
                    ? $this->cleanText($name)
                    : null;
            }

            if (array_key_exists('unit_number', $data)) {
                $payload['unit_number'] = $this->cleanText($data['unit_number']);
            }

            if (array_key_exists('monthly_rent', $data)) {
                $payload['monthly_rent'] = $this->money($data['monthly_rent']);
            }

            if (array_key_exists('status', $data)) {
                $payload['status'] = $data['status'];
            }

            if ($payload !== []) {
                $unit->update($payload);
            }

            return $unit->fresh('building');
        });
    }

    public function createLease(array $data)
    {
        return DB::transaction(function () use ($data) {
            $unit = ApartmentUnit::where(
                'apartment_unit_id',
                $data['apartment_unit_id']
            )->lockForUpdate()->firstOrFail();

            if ($unit->status !== 'Vacant') {
                throw ValidationException::withMessages([
                    'apartment_unit_id' => 'This apartment unit is not vacant.',
                ]);
            }

            $lease = Lease::create([
                'tenant_id' => $data['tenant_id'],
                'apartment_unit_id' => $unit->apartment_unit_id,
                'monthly_rent' => $this->money($data['monthly_rent']),
                'security_deposit' => $this->money($data['security_deposit']),
                'lease_start' => $data['lease_start'],
                'lease_end' => $data['lease_end'],
            ]);

            $utilityCharge = $this->money($data['utility_charge']);
            $totalDue = $this->money(
                $lease->monthly_rent + $utilityCharge + $lease->security_deposit
            );

            UtilityBill::create([
                'lease_id' => $lease->lease_id,
                'utility_charge' => $utilityCharge,
                'total_due' => $totalDue,
                'payment_status' => $data['payment_status'],
            ]);

            $unit->update([
                'status' => 'Occupied',
            ]);

            return $lease->load([
                'tenant',
                'apartmentUnit.building',
                'utilityBills',
            ]);
        });
    }

    public function updateLease($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $lease = Lease::where('lease_id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            $oldUnitId = $lease->apartment_unit_id;
            $newUnitId = (int) ($data['apartment_unit_id'] ?? $oldUnitId);
            $newUnit = null;

            if ($oldUnitId != $newUnitId) {
                $newUnit = ApartmentUnit::where(
                    'apartment_unit_id',
                    $newUnitId
                )->lockForUpdate()->firstOrFail();

                if ($newUnit->status !== 'Vacant') {
                    throw ValidationException::withMessages([
                        'apartment_unit_id' => 'The selected apartment unit is not vacant.',
                    ]);
                }
            }

            $leaseChanges = [];

            foreach (['tenant_id', 'lease_start', 'lease_end'] as $field) {
                if (array_key_exists($field, $data)) {
                    $leaseChanges[$field] = $data[$field];
                }
            }

            if ($oldUnitId != $newUnitId) {
                $leaseChanges['apartment_unit_id'] = $newUnitId;
            }

            foreach (['monthly_rent', 'security_deposit'] as $field) {
                if (array_key_exists($field, $data)) {
                    $leaseChanges[$field] = $this->money($data[$field]);
                }
            }

            if ($leaseChanges !== []) {
                $lease->update($leaseChanges);
            }

            if ($oldUnitId != $newUnitId) {
                ApartmentUnit::where(
                    'apartment_unit_id',
                    $oldUnitId
                )->update([
                    'status' => 'Vacant',
                ]);

                $newUnit?->update([
                    'status' => 'Occupied',
                ]);
            }

            $bill = $lease->utilityBills()->lockForUpdate()->first();
            $billFields = ['monthly_rent', 'security_deposit', 'utility_charge', 'payment_status'];
            $billWasRequested = array_intersect($billFields, array_keys($data)) !== [];

            if ($bill || $billWasRequested) {
                $utilityCharge = $this->money(
                    $data['utility_charge'] ?? $bill?->utility_charge ?? 0
                );
                $billChanges = [
                    'utility_charge' => $utilityCharge,
                    'total_due' => $this->money(
                        $lease->monthly_rent + $utilityCharge + $lease->security_deposit
                    ),
                ];

                if (array_key_exists('payment_status', $data)) {
                    $billChanges['payment_status'] = $data['payment_status'];
                }

                if ($bill) {
                    $bill->update($billChanges);
                } else {
                    UtilityBill::create([
                        'lease_id' => $lease->lease_id,
                        ...$billChanges,
                    ]);
                }
            }

            return $lease->fresh([
                'tenant',
                'apartmentUnit.building',
                'utilityBills',
            ]);
        });
    }
}
