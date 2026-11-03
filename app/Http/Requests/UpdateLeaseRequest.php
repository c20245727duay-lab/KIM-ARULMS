<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_name' => ['sometimes', 'required', 'string', 'max:255'],
            'tenant_email' => ['sometimes', 'required', 'email', 'max:255'],
            'tenant_phone' => ['sometimes', 'required', 'string', 'max:30'],
            'apartment_unit_id' => ['sometimes', 'required', 'integer', 'exists:apartment_units,id'],
            'security_deposit' => ['sometimes', 'required', 'numeric', 'min:0'],
            'lease_start' => ['sometimes', 'required', 'date'],
            'lease_end' => ['sometimes', 'required', 'date', 'after:lease_start'],
            'utility_charge' => ['sometimes', 'required', 'numeric', 'min:0'],
            'payment_status' => ['sometimes', 'required', 'in:Unpaid,Paid,Partial'],
        ];
    }

    public function messages(): array
    {
        return [
            'tenant_email.email' => 'Enter a valid tenant email.',
            'lease_end.after' => 'Lease end must be after lease start.',
            'apartment_unit_id.exists' => 'The selected apartment unit does not exist.',
            'payment_status.in' => 'Payment status must be Unpaid, Paid, or Partial.',
        ];
    }
}