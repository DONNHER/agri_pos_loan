<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Class ActivityLogController
 * 
 * Provides administrative access to the system's audit trail.
 * Allows searching, filtering, and exporting of activity logs.
 * 
 * @package App\Http\Controllers\Api
 */
class ActivityLogController extends Controller
{
    /**
     * Display a listing of activity logs with advanced filtering.
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with('user');

        // Global Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('log_type')) {
            $query->where('log_type', $request->log_type);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', Carbon::parse($request->start_date)->startOfDay());
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', Carbon::parse($request->end_date)->endOfDay());
        }

        $perPage = $request->get('limit', 20);
        $logs = $query->latest('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ]
        ]);
    }

    /**
     * Store a new activity log.
     * ✅ Added to fix the frontend error.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required',
            'action' => 'required|string',
            'description' => 'nullable|string',
            'ip_address' => 'nullable|string',
        ]);

        $log = ActivityLog::create([
            'user_id' => $request->user_id,
            'log_type' => $request->get('log_type', 'info'),
            'action' => $request->action,
            'description' => $request->description,
            'ip_address' => $request->ip_address ?? $request->ip(),
            'device_info' => $request->header('User-Agent'),
        ]);

        return response()->json([
            'success' => true,
            'data' => $log
        ], 201);
    }

    /**
     * Export the filtered activity logs to a CSV file.
     */
    public function export(Request $request)
    {
        $query = ActivityLog::latest('created_at');
        if ($request->filled('log_type')) $query->where('log_type', $request->log_type);
        if ($request->filled('start_date')) $query->where('created_at', '>=', $request->start_date);
        if ($request->filled('end_date')) $query->where('created_at', '<=', $request->end_date);

        $logs = $query->get();
        $filename = "activity_logs_" . date('Y-m-d_H-i-s') . ".csv";
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
        ];

        $columns = ['ID', 'User ID', 'Log Type', 'Action', 'Description', 'IP Address', 'Timestamp'];

        $callback = function() use($logs, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id, $log->user_id, $log->log_type, $log->action, $log->description, $log->ip_address, $log->created_at,
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function cleanup()
    {
        $count = ActivityLog::where('created_at', '<', now()->subDays(90))->delete();
        return response()->json(['success' => true, 'message' => "Cleaned up $count logs."]);
    }

    public function count(Request $request)
    {
        $query = ActivityLog::query();
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        return response()->json(['success' => true, 'total' => $query->count()]);
    }
}
