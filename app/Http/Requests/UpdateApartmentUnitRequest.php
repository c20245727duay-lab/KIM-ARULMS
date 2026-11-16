<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApartmentUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'building_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:buildings,building_id',
            ],
            'unit_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
            ],
            'monthly_rent' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],
            'status' => [
                'sometimes',
                'required',
                'in:Vacant,Occupied,Maintenance',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'building_id.required' => 'Please select a building.',
            'building_id.exists' => 'The selected building does not exist.',
            'unit_number.required' => 'Unit number is required.',
            'monthly_rent.required' => 'Monthly rent is required.',
            'monthly_rent.numeric' => 'Monthly rent must be a number.',
            'monthly_rent.min' => 'Monthly rent cannot be negative.',
            'status.required' => 'Unit status is required.',
            'status.in' => 'Invalid apartment unit status.',
        ];
    }
}