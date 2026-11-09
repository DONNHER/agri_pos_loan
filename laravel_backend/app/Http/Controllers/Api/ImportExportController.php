<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

// Exports
use App\Exports\TransactionsExport;
use App\Exports\UsersExport;
use App\Exports\LoansExport;
use App\Exports\ActivityLogsExport;

// Imports
use App\Imports\LoansImport;
use App\Imports\TransactionsImport;
use App\Imports\UsersImport;
use App\Imports\ActivityLogsImport;

// Models
use App\Models\Transaction;
use App\Models\User;
use App\Models\Loan;

class ImportExportController extends Controller
{
    /**
     * Handle Exports (Excel/CSV/PDF)
     */
    public function export(Request $request, $type = null, $format = null)
    {
        $type = strtolower(trim($type ?? $request->route('type')));
        $format = strtolower(trim($format ?? $request->route('format')));
        $filename = $type . '_report_' . now()->format('Ymd_His');

        if (in_array($format, ['xlsx', 'csv'])) {
            return match($type) {
                'transactions'  => Excel::download(new TransactionsExport(), $filename . '.' . $format),
                'users'         => Excel::download(new UsersExport(), $filename . '.' . $format),
                'loans'         => Excel::download(new LoansExport(), $filename . '.' . $format),
                'activity-logs' => Excel::download(new ActivityLogsExport(), $filename . '.' . $format),
                default         => response()->json(['error' => 'Format/Type not supported'], 400),
            };
        }

        if ($format === 'pdf') {
            return $this->generatePdfReport($type, $filename);
        }

        return response()->json(['error' => 'Unsupported format.'], 400);
    }

    /**
     * Preview Import (Dry Run with Validation, Duplicate Checking & Metrics)
     */
    public function previewImport(Request $request, $type)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,csv']);

        $import = $this->getImportInstance($type);
        if (!$import) {
            return response()->json(['message' => 'Type not supported'], 404);
        }

        try {
            $import->isPreview = true;
            Excel::import($import, $request->file('file'));

            return response()->json([
                'success' => true,

                // Flutter PreviewDialog expects these
                'total_rows' =>
                    ($import->successCount ?? 0) +
                    count($import->errors ?? []),

                'valid_rows' => $import->successCount ?? 0,

                'error_rows' => count($import->errors ?? []),

                'duplicates' => [],

                // keep old fields too
                'success_count' => $import->successCount ?? 0,
                'failure_count' => $import->failureCount ?? 0,

                'errors' => $import->errors ?? [],
            ]);
        } catch (\Exception $e) {
            Log::error("Import Preview Error [{$type}]: " . $e->getMessage());
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Confirm Import (Final Save with Metrics)
     */
    public function confirmImport(Request $request, $type)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,csv']);

        $import = $this->getImportInstance($type);
        if (!$import) {
            return response()->json(['message' => 'Type not supported'], 404);
        }

        try {
            $import->isPreview = false;
            Excel::import($import, $request->file('file'));

            return response()->json([
                'message'       => 'Import completed successfully',
                'success_count' => $import->successCount ?? 0,
                'failure_count' => $import->failureCount ?? count($import->errors ?? []),
                'error_report'  => $import->errors ?? [],
            ]);
        } catch (\Exception $e) {
            Log::error("Import Confirmation Error [{$type}]: " . $e->getMessage());
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Helper to resolve Import classes
     */
    private function getImportInstance($type)
    {
        return match($type) {
            'loans'         => new LoansImport(),
            'transactions'  => new TransactionsImport(),
            'users'         => new UsersImport(),
            'activity-logs' => new ActivityLogsImport(),
            default         => null,
        };
    }

    /**
     * Generate PDF Reports
     */
    private function generatePdfReport($type, $filename)
    {
        try {
            $data = match($type) {
                'transactions'  => Transaction::all(),
                'users'         => User::all(),
                'loans'         => Loan::with('shareholder.user')->get(),
                'activity-logs' => [], // Replace with your ActivityLog model if needed
                default         => null,
            };

            if (is_null($data)) {
                return response()->json(['error' => 'PDF Type not supported'], 400);
            }

            // Ensure you have a matching blade view in resources/views/pdf/{type}_report.blade.php
            $viewName = 'pdf.' . $type . '_report';

            if (!view()->exists($viewName)) {
                $viewName = 'reports.generic';
            }

            $rows = [];

            foreach ($data as $item) {

                $rows[] = [
                    'id' => $item->id ?? '',
                    'reference_id' => $item->reference_id ?? '',
                    'shareholder' => $item->shareholder->user->name ?? '',
                    'method' => $item->method ?? '',
                    'type' => $item->type ?? '',
                    'amount' => $item->amount ?? '',
                    'status' => $item->status ?? '',
                    'date' => $item->created_at ?? '',
                ];

            }


            $pdf = Pdf::loadView('reports.generic', [

                'title' => ucwords(str_replace('-', ' ', $type)),

                'subtitle' => 'Generated Report',

                'generatedAt' => now()->format('Y-m-d H:i:s'),

                'summary' => [
                    [
                        'label' => 'Total Records',
                        'value' => count($rows)
                    ]
                ],

                'headers' => [
                    'ID',
                    'Reference ID',
                    'Shareholder',
                    'Method',
                    'Type',
                    'Amount',
                    'Status',
                    'Date'
                ],

                'rows' => $rows,

            ]);
            return $pdf->download($filename . '.pdf');
        } catch (\Exception $e) {
            Log::error("PDF Generation Error [{$type}]: " . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }
}