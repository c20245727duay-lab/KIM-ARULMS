<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use Illuminate\Http\Request;

class WorkOrderController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'apartment_unit_id' => ['required', 'exists:apartment_units,apartment_unit_id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'priority' => ['required', 'in:Low,Medium,High'],
        ]);

        $workOrder = WorkOrder::create($data + ['status' => 'Open']);

        return response()->json([
            'message' => 'Work order created successfully.',
            'data' => $workOrder->load('apartmentUnit.building'),
        ], 201);
    }

    public function updateStatus(Request $request, WorkOrder $workOrder)
    {
        $data = $request->validate([
            'status' => ['required', 'in:Open,In Progress,Completed'],
        ]);

        $workOrder->update($data);

        return response()->json([
            'message' => 'Work order updated successfully.',
            'data' => $workOrder->fresh('apartmentUnit.building'),
        ]);
    }
}
