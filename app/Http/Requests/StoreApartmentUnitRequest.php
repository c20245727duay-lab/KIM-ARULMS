<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApartmentUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'building_id' => ['required', 'exists:buildings,building_id'],
            'unit_name' => ['nullable', 'string', 'max:255'],
            'unit_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('apartment_units', 'unit_number')
                    ->where(fn ($query) => $query->where('building_id', $this->input('building_id'))),
            ],
            'monthly_rent' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:Vacant,Occupied,Maintenance'],
        ];
    }

    public function messages(): array
    {
        return [
            'building_id.required' => 'Please select a building.',
            'building_id.exists' => 'The selected building does not exist.',
            'unit_name.string' => 'Apartment unit name must be a valid string.',
            'unit_name.max' => 'Apartment unit name must not exceed 255 characters.',
            'unit_number.required' => 'Unit number is required.',
            'unit_number.max' => 'Unit number must not exceed 50 characters.',
            'unit_number.unique' => 'This unit number already exists in the selected building.',
            'monthly_rent.required' => 'Monthly rent is required.',
            'monthly_rent.numeric' => 'Monthly rent must be a number.',
            'monthly_rent.min' => 'Monthly rent cannot be negative.',
            'status.required' => 'Unit status is required.',
            'status.in' => 'Please select a valid unit status.',
        ];
    }
}
