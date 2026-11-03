<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApartmentUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'building_block' => ['required', 'string', 'max:50'],
            'unit_number' => ['required', 'string', 'max:50'],
            'monthly_rent' => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:Vacant,Occupied,Maintenance'],
        ];
    }

    public function messages(): array
    {
        return [
            'building_block.required' => 'Building block is required.',
            'unit_number.required' => 'Unit number is required.',
            'monthly_rent.required' => 'Monthly rent is required.',
            'monthly_rent.min' => 'Monthly rent cannot be negative.',
            'status.in' => 'Choose a valid unit status.',
        ];
    }
}