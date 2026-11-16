<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBuildingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $buildingBlock = $this->input('building_block');

        if (is_string($buildingBlock)) {
            $this->merge([
                'building_block' => strtoupper(trim(strip_tags($buildingBlock))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'building_block' => [
                'required',
                'string',
                'max:50',
                Rule::unique('buildings', 'building_block'),
            ],
        ];
    }
}
