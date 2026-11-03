<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\Building;
use App\Models\ApartmentUnit;
use App\Models\Lease;
use App\Models\UtilityBill;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApartmentRentalService
{
    private function cleanText(string $value): string
    {
        return trim(strip_tags($value));
    }

    private function cleanPhone(string $phone): string
    {
        // Keep digits and an optional leading plus sign.
        $phone = trim(strip_tags($phone));
        $phone = preg_replace('/[^0-9+]/', '', $phone) ?? '';

        if (str_contains(substr($phone, 1), '+')) {
            $phone = str_replace('+', '', $phone);
        }

        return $phone;
    }

    private function cleanMoney($value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    public function createApartmentUnit(array $data): ApartmentUnit
    {
        return DB::transaction(function () use ($data) {
            $block = strtoupper(
                $this->cleanText($data['building_block'])
            );

            $building = Building::firstOrCreate([
                'building_block' => $block,
            ]);

            return ApartmentUnit::create([
                'building_id' => $building->id,
                'unit_number' => $this->cleanText($data['unit_number']),
                'monthly_rent' => $this->cleanMoney($data['monthly_rent']),
                'status' => $data['status'] ?? 'Vacant',
            ]);
        });
    }

    public function updateApartmentUnit(
        array $data,
        int $id
    ): ApartmentUnit {
        return DB::transaction(function () use ($data, $id) {
            $unit = ApartmentUnit::findOrFail($id);

            if (isset($data['building_block'])) {
                $block = strtoupper(
                    $this->cleanText($data['building_block'])
                );

                $building = Building::firstOrCreate([
                    'building_block' => $block,
                ]);

                $unit->building_id = $building->id;
            }

            if (isset($data['unit_number'])) {
                $unit->unit_number = $this->cleanText(
                    $data['unit_number']
                );
            }

            if (isset($data['monthly_rent'])) {
                $unit->monthly_rent = $this->cleanMoney(
                    $data['monthly_rent']
                );
            }

            if (isset($data['status'])) {
                if (
                    $data['status'] === 'Vacant' &&
                    $unit->leases()->whereHas(
                        'utilityBill',
                        fn ($query) => $query->whereRaw('1 = 1')
                    )->exists()
                ) {
                    throw ValidationException::withMessages([
                        'status' => 'Check the lease before marking this unit vacant.',
                    ]);
                }

                $unit->status = $data['status'];
            }

            $unit->save();

            return $unit->load('building');
        });
    }

    public function createLease(array $data): Lease
    {
        return DB::transaction(function () use ($data) {
            $unit = ApartmentUnit::whereKey(
                $data['apartment_unit_id']
            )->lockForUpdate()->firstOrFail();

            if ($unit->status !== 'Vacant') {
                throw ValidationException::withMessages([
                    'apartment_unit_id' =>
                        'This apartment unit is not Vacant.',
                ]);
            }

            $email = strtolower(
                $this->cleanText($data['tenant_email'])
            );

            $phone = $this->cleanPhone($data['tenant_phone']);

            if ($phone === '') {
                throw ValidationException::withMessages([
                    'tenant_phone' => 'Enter a valid phone number.',
                ]);
            }

            $tenant = Tenant::firstOrNew([
                'tenant_email' => $email,
            ]);

            $tenant->tenant_name = $this->cleanText(
                $data['tenant_name']
            );

            $tenant->tenant_email = $email;
            $tenant->tenant_phone = $phone;
            $tenant->save();

            $lease = Lease::create([
                'tenant_id' => $tenant->id,
                'apartment_unit_id' => $unit->id,
                'security_deposit' => $this->cleanMoney(
                    $data['security_deposit']
                ),
                'lease_start' => $data['lease_start'],
                'lease_end' => $data['lease_end'],
                'payment_status' => $data['payment_status'] ?? 'Unpaid',
            ]);

            $utilityCharge = (float) $data['utility_charge'];
            $rent = (float) $unit->monthly_rent;
            $deposit = (float) $lease->security_deposit;

            $totalDue = $rent + $utilityCharge + $deposit;

            UtilityBill::create([
                'lease_id' => $lease->id,
                'utility_charge' => $this->cleanMoney($utilityCharge),
                'total_due' => $this->cleanMoney($totalDue),
            ]);

            $unit->status = 'Occupied';
            $unit->save();

            return $lease->load([
                'tenant',
                'apartmentUnit.building',
                'utilityBill',
            ]);
        });
    }

    public function updateLease(array $data, int $id): Lease
    {
        return DB::transaction(function () use ($data, $id) {
            $lease = Lease::with([
                'tenant',
                'apartmentUnit',
                'utilityBill',
            ])->findOrFail($id);

            $oldUnit = ApartmentUnit::whereKey(
                $lease->apartment_unit_id
            )->lockForUpdate()->firstOrFail();

            $newUnitId = $data['apartment_unit_id']
                ?? $lease->apartment_unit_id;

            $newUnit = ApartmentUnit::whereKey($newUnitId)
                ->lockForUpdate()->firstOrFail();

            if (
                $newUnit->id !== $oldUnit->id &&
                $newUnit->status !== 'Vacant'
            ) {
                throw ValidationException::withMessages([
                    'apartment_unit_id' =>
                        'The new apartment unit is not Vacant.',
                ]);
            }

            $tenantData = [];

            foreach ([
                'tenant_name',
                'tenant_email',
                'tenant_phone',
            ] as $field) {
                if (array_key_exists($field, $data)) {
                    $tenantData[$field] = $data[$field];
                }
            }

            if (isset($tenantData['tenant_name'])) {
                $tenantData['tenant_name'] = $this->cleanText(
                    $tenantData['tenant_name']
                );
            }

            if (isset($tenantData['tenant_email'])) {
                $tenantData['tenant_email'] = strtolower(
                    $this->cleanText($tenantData['tenant_email'])
                );
            }

            if (isset($tenantData['tenant_phone'])) {
                $tenantData['tenant_phone'] = $this->cleanPhone(
                    $tenantData['tenant_phone']
                );

                if ($tenantData['tenant_phone'] === '') {
                    throw ValidationException::withMessages([
                        'tenant_phone' => 'Enter a valid phone number.',
                    ]);
                }
            }

            $lease->tenant->update($tenantData);

            if (isset($data['security_deposit'])) {
                $lease->security_deposit = $this->cleanMoney(
                    $data['security_deposit']
                );
            }

            if (isset($data['lease_start'])) {
                $lease->lease_start = $data['lease_start'];
            }

            if (isset($data['lease_end'])) {
                $lease->lease_end = $data['lease_end'];
            }

            if (isset($data['payment_status'])) {
                $lease->payment_status = $data['payment_status'];
            }

            $lease->apartment_unit_id = $newUnit->id;
            $lease->save();

            $bill = $lease->utilityBill;

            if (isset($data['utility_charge'])) {
                $bill->utility_charge = $this->cleanMoney(
                    $data['utility_charge']
                );
            }

            $rent = (float) $newUnit->monthly_rent;
            $deposit = (float) $lease->security_deposit;
            $charge = (float) $bill->utility_charge;

            $bill->total_due = $this->cleanMoney(
                $rent + $charge + $deposit
            );

            $bill->save();

            if ($newUnit->id !== $oldUnit->id) {
                $oldUnit->status = 'Vacant';
                $oldUnit->save();

                $newUnit->status = 'Occupied';
                $newUnit->save();
            }

            return $lease->load([
                'tenant',
                'apartmentUnit.building',
                'utilityBill',
            ]);
        });
    }
}
