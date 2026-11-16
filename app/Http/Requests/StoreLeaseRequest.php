<?php

namespace App\Http\Requests;

use Carbon\Carbon;
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
            'tenant_id' => [
                'required',
                'exists:tenants,tenant_id',
            ],
            'apartment_unit_id' => [
                'required',
                'exists:apartment_units,apartment_unit_id',
            ],
            'monthly_rent' => [
                'required',
                'numeric',
                'min:0',
            ],
            'security_deposit' => [
                'required',
                'numeric',
                'min:0',
            ],
            'lease_start' => [
                'required',
                'date',
                'after_or_equal:today',
            ],
            'lease_end' => [
                'required',
                'date',
                'after_or_equal:today',
                'after_or_equal:lease_start',
            ],
            'utility_charge' => [
                'required',
                'numeric',
                'min:0',
            ],
            'payment_status' => [
                'required',
                'in:Pending,Paid,Overdue',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (! $this->lease_start || ! $this->lease_end) {
                return;
            }

            $start = Carbon::parse($this->lease_start)->startOfDay();
            $end = Carbon::parse($this->lease_end)->startOfDay();
            $dayDifference = (int) (($end->getTimestamp() - $start->getTimestamp()) / 86400);

            if ($dayDifference < 5) {
                $validator->errors()->add('lease_end', 'Lease end date must be at least 5 days after the start date.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'tenant_id.required' => 'Please select a tenant.',
            'tenant_id.exists' => 'Selected tenant does not exist.',
            'apartment_unit_id.required' => 'Please select an apartment unit.',
            'apartment_unit_id.exists' => 'Selected apartment unit does not exist.',
            'monthly_rent.required' => 'Monthly rent is required.',
            'monthly_rent.numeric' => 'Monthly rent must be a number.',
            'monthly_rent.min' => 'Monthly rent cannot be negative.',
            'security_deposit.required' => 'Security deposit is required.',
            'lease_start.required' => 'Lease start date is required.',
            'lease_start.after_or_equal' => 'Lease start date cannot be in the past.',
            'lease_end.after_or_equal' => 'Lease end date cannot be in the past.',
            'lease_end.after_or_equal:lease_start' => 'Lease end date must be on or after the lease start date.',
            'utility_charge.required' => 'Utility charge is required.',
            'payment_status.in' => 'Invalid payment status.',
        ];
    }
}
