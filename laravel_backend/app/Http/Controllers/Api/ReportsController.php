<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportPreference;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportsController extends Controller
{
    public function __construct(protected ReportService $reportService)
    {
    }

    public function index()
    {
        return response()->json([
            'success' => true,
            'reports' => $this->reportService->getAvailableReports(),
        ]);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'report_type' => 'required|string',
            'format' => 'nullable|in:pdf,xlsx',
        ]);

        $report = $this->reportService->generate(
            $request->input('report_type'),
            $request->input('format', 'pdf'),
            $request->input('filters', [])
        );

        return response()->json($report);
    }

    public function download(string $filename)
    {
        $path = storage_path('app/reports/' . $filename);
        if (!file_exists($path)) {
            return response()->json(['success' => false, 'message' => 'Report not found'], 404);
        }

        return response()->download($path, $filename);
    }

    public function listPreferences(Request $request)
    {
        $preferences = ReportPreference::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $preferences]);
    }

    public function savePreference(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'report_type' => 'required|string',
            'format' => 'nullable|in:pdf,xlsx',
        ]);

        $preference = ReportPreference::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'name' => $request->name,
            ],
            [
                'report_type' => $request->report_type,
                'format' => $request->input('format', 'pdf'),
                'filters' => $request->input('filters', []),
            ]
        );

        return response()->json(['success' => true, 'data' => $preference]);
    }

    public function schedule(Request $request)
    {
        $request->validate([
            'report_type' => 'required|string',
            'email' => 'required|email',
            'format' => 'nullable|in:pdf,xlsx',
        ]);

        $report = $this->reportService->sendReportByEmail(
            $request->report_type,
            $request->input('format', 'pdf'),
            $request->input('filters', []),
            $request->email
        );

        return response()->json(['success' => true, 'report' => $report]);
    }
}
