<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_name' => ['required', 'string', 'max:255'],
            'tenant_email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('tenants', 'tenant_email'),
            ],
            'tenant_phone' => ['required', 'string', 'max:30'],
        ];
    }
}
