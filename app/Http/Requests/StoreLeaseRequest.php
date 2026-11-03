<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_name' => ['required', 'string', 'max:255'],
            'tenant_email' => ['required', 'email', 'max:255'],
            'tenant_phone' => ['required', 'string', 'max:30'],
            'apartment_unit_id' => ['required', 'integer', 'exists:apartment_units,id'],
            'security_deposit' => ['required', 'numeric', 'min:0'],
            'lease_start' => ['required', 'date'],
            'lease_end' => ['required', 'date', 'after:lease_start'],
            'utility_charge' => ['required', 'numeric', 'min:0'],
            'payment_status' => ['sometimes', 'in:Unpaid,Paid,Partial'],
        ];
    }

    public function messages(): array
    {
        return [
            'tenant_name.required' => 'Tenant name is required.',
            'tenant_email.email' => 'Enter a valid tenant email.',
            'apartment_unit_id.exists' => 'The selected apartment unit does not exist.',
            'lease_end.after' => 'Lease end must be after lease start.',
            'security_deposit.min' => 'Security deposit cannot be negative.',
            'utility_charge.min' => 'Utility charge cannot be negative.',
        ];
    }
}