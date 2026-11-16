<?php

namespace App\Http\Requests;

use App\Models\Lease;
use Carbon\Carbon;
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
            'tenant_id' => ['sometimes', 'required', 'exists:tenants,tenant_id'],
            'apartment_unit_id' => ['sometimes', 'required', 'exists:apartment_units,apartment_unit_id'],
            'monthly_rent' => ['sometimes', 'required', 'numeric', 'min:0'],
            'security_deposit' => ['sometimes', 'required', 'numeric', 'min:0'],
            'lease_start' => ['sometimes', 'required', 'date', 'after_or_equal:today'],
            'lease_end' => ['sometimes', 'required', 'date', 'after_or_equal:today'],
            'utility_charge' => ['sometimes', 'required', 'numeric', 'min:0'],
            'payment_status' => ['sometimes', 'required', 'in:Pending,Paid,Overdue'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->has('lease_start') || $validator->errors()->has('lease_end')) {
                return;
            }

            $leaseId = $this->route('id') ?? $this->route('lease');
            $lease = Lease::where('lease_id', $leaseId)->first();
            $startDate = $this->input('lease_start', $lease?->lease_start?->toDateString());
            $endDate = $this->input('lease_end', $lease?->lease_end?->toDateString());

            if ($startDate === null || $endDate === null) {
                return;
            }

            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->startOfDay();

            if ($start->diffInDays($end, false) < 5) {
                $validator->errors()->add('lease_end', 'Lease end date must be at least 5 days after the start date.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'tenant_id.required' => 'Tenant is required.',
            'apartment_unit_id.required' => 'Apartment unit is required.',
            'monthly_rent.required' => 'Monthly rent is required.',
            'security_deposit.required' => 'Security deposit is required.',
            'lease_start.required' => 'Start date is required.',
            'lease_start.after_or_equal' => 'Lease start date cannot be in the past.',
            'lease_end.after_or_equal' => 'Lease end date cannot be in the past.',
            'utility_charge.required' => 'Utility charge is required.',
            'payment_status.in' => 'Invalid payment status.',
        ];
    }
}
