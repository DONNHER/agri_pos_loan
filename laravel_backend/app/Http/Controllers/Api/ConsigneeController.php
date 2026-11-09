<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consignee;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

/**
 * Class ConsigneeController
 * 
 * Manages the directory of consignees (partners who sell products on behalf of the cooperative).
 * Implements advanced data controls, soft deletes, and audit trails.
 * 
 * @package App\Http\Controllers\Api
 */
class ConsigneeController extends Controller
{
    /**
     * Display a listing of consignees with advanced controls and soft deletes.
     * Supports ?trashed_only=true and ?with_trashed=true.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $searchable = ['full_name', 'phone', 'address'];
        
        $query = Consignee::query();

        if ($request->boolean('trashed_only')) {
            $query->onlyTrashed();
        } elseif ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        $query = Consignee::applyControls($query, $request, $searchable);

        return response()->json(Consignee::getPaginatedResponse($query, $request));
    }

    /**
     * CREATE: Store a new consignee record.
     * Success triggers an automatic audit log entry via the Loggable trait.
     */
    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $consignee = Consignee::create($request->all());
        return response()->json([
            'success' => true, 
            'message' => 'Consignee created successfully', 
            'data' => $consignee
        ], 201);
    }

    /**
     * READ: Display a specific consignee's details along with its audit trail.
     */
    public function show($id)
    {
        $consignee = Consignee::withTrashed()->findOrFail($id);
        
        // Fetch the last 20 audit logs for this specific consignee
        $auditTrail = ActivityLog::where('description', 'like', "%consignees (ID: {$id})%")
            ->latest('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true, 
            'data' => $consignee,
            'audit_trail' => $auditTrail
        ]);
    }

    /**
     * UPDATE: Modify an existing consignee record.
     * Implements Optimistic Locking using the 'version' field.
     */
    public function update(Request $request, $id)
    {
        $consignee = Consignee::findOrFail($id);

        $request->validate([
            'version' => 'required|integer', // Required for optimistic locking check
        ]);

        try {
            $consignee->version = $request->version;
            $consignee->update($request->all());

            return response()->json([
                'success' => true, 
                'message' => 'Consignee updated successfully', 
                'data' => $consignee
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => $e->getMessage()
            ], 409); // Return conflict if version mismatch
        }
    }

    /**
     * DELETE: Soft-delete a consignee.
     * Includes a dependency check for active consignments.
     */
    public function destroy($id)
    {
        $consignee = Consignee::findOrFail($id);

        // Cascade delete warning: Check if they are currently holding inventory
        if (method_exists($consignee, 'consignments') && $consignee->consignments()->exists() && !request()->boolean('force')) {
            return response()->json([
                'success' => false,
                'requires_confirmation' => true,
                'message' => 'This consignee has active consignments. Deleting may affect inventory history. Proceed?'
            ], 409);
        }

        $consignee->delete();
        return response()->json(['success' => true, 'message' => 'Consignee soft-deleted successfully']);
    }

    /**
     * Restore a previously soft-deleted consignee.
     */
    public function restore($id)
    {
        $consignee = Consignee::onlyTrashed()->findOrFail($id);
        $consignee->restore();

        return response()->json([
            'success' => true, 
            'message' => 'Consignee record restored successfully', 
            'data' => $consignee
        ]);
    }

    /**
     * Perform bulk operations (delete, restore, export) on multiple records.
     */
    public function bulkAction(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string|in:delete,restore,export',
        ]);

        $ids = $request->ids;

        switch ($request->action) {
            case 'delete':
                Consignee::whereIn('id', $ids)->delete();
                return response()->json(['success' => true, 'message' => count($ids) . ' consignees soft-deleted.']);
            
            case 'restore':
                Consignee::onlyTrashed()->whereIn('id', $ids)->restore();
                return response()->json(['success' => true, 'message' => count($ids) . ' consignees restored.']);

            case 'export':
                return $this->export($request, $ids);
        }
    }

    /**
     * Export the current view or selected records to a CSV file.
     */
    public function export(Request $request, $ids = null)
    {
        $query = Consignee::query();
        if ($ids) {
            $query->whereIn('id', $ids);
        } else {
            $query = Consignee::applyControls($query, $request, ['full_name', 'phone', 'address']);
        }

        $data = $query->get();
        $filename = 'consignees_export_' . date('Ymd_His') . '.csv';
        
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
        ];

        $callback = function() use($data) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Full Name', 'Phone', 'Address', 'Created At']);
            foreach ($data as $row) {
                fputcsv($file, [
                    $row->id, $row->full_name, $row->phone, $row->address, $row->created_at
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Fast search endpoint for consignee lookups.
     */
    public function search(Request $request)
    {
        $query = $request->get('query');
        $results = Consignee::where('full_name', 'like', "%$query%")
            ->orWhere('phone', 'like', "%$query%")
            ->orWhere('address', 'like', "%$query%")
            ->get();
        return response()->json(['success' => true, 'data' => $results]);
    }
}
