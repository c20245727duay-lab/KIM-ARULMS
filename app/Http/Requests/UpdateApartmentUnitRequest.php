<?php

namespace App\Http\Requests;

use App\Models\ApartmentUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApartmentUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $routeUnit = $this->route('apartment_unit');
        $unitId = $routeUnit instanceof ApartmentUnit
            ? $routeUnit->getKey()
            : ($routeUnit ?? $this->route('id'));
        $buildingId = $routeUnit instanceof ApartmentUnit
            ? $routeUnit->building_id
            : $this->input('building_id');

        if (empty($buildingId) && $unitId !== null) {
            $buildingId = ApartmentUnit::whereKey($unitId)->value('building_id');
        }

        $unitNumberRule = Rule::unique('apartment_units', 'unit_number')
            ->ignore($unitId, 'apartment_unit_id');

        if (!empty($buildingId)) {
            $unitNumberRule->where(
                fn ($query) => $query->where('building_id', $buildingId)
            );
        }

        return [
            'building_id' => ['sometimes', 'required', 'integer', 'exists:buildings,building_id'],
            'unit_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'unit_number' => ['sometimes', 'required', 'string', 'max:50', $unitNumberRule],
            'monthly_rent' => ['sometimes', 'required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'required', 'in:Vacant,Occupied,Maintenance'],
        ];
    }

    public function messages(): array
    {
        return [
            'building_id.required' => 'Please select a building.',
            'building_id.exists' => 'The selected building does not exist.',
            'building_id.integer' => 'Please select a valid building.',
            'unit_name.string' => 'Apartment unit name must be a valid string.',
            'unit_name.max' => 'Apartment unit name must not exceed 255 characters.',
            'unit_number.required' => 'Unit number is required.',
            'unit_number.max' => 'Unit number must not exceed 50 characters.',
            'unit_number.unique' => 'This unit number already exists in the selected building.',
            'monthly_rent.required' => 'Monthly rent is required.',
            'monthly_rent.numeric' => 'Monthly rent must be a number.',
            'monthly_rent.min' => 'Monthly rent cannot be negative.',
            'status.required' => 'Unit status is required.',
            'status.in' => 'Invalid apartment unit status.',
        ];
    }
}
