<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Services\BackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Class BackupController
 * 
 * Provides API endpoints for managing system backups. 
 * Allows admins to view history, change settings, and trigger manual snapshots.
 * 
 * @package App\Http\Controllers\Api
 */
class BackupController extends Controller
{
    /**
     * @var BackupService The service handling backup logic.
     */
    protected $backupService;

    /**
     * Dependency Injection of the BackupService.
     */
    public function __construct(BackupService $backupService)
    {
        $this->backupService = $backupService;
    }

    /**
     * Fetch all backup-related settings (frequency, email, etc.).
     */
    public function getSettings()
    {
        $settings = SiteSetting::where('group', 'backup')->get();
        return response()->json([
            'success' => true,
            'settings' => $settings,
            'retention_policy' => '30 days'
        ]);
    }

    /**
     * Bulk update backup settings.
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($request->settings as $key => $value) {
            SiteSetting::updateOrCreate(
                ['key' => $key, 'group' => 'backup'],
                ['value' => $value]
            );
        }

        return response()->json(['success' => true, 'message' => 'Backup settings updated']);
    }

    /**
     * Manually trigger a backup process.
     * 
     * @param Request $request Expects 'type' (db, files, or full).
     */
    public function runManualBackup(Request $request)
    {
        $type = $request->get('type', 'db'); 
        
        try {
            $result = $this->backupService->run($type);
            
            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => "Manual " . strtoupper($type) . " backup completed successfully.",
                    'file' => basename($result['filename'])
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => "Backup failed: " . $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Backup Controller Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => "Internal Server Error: " . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all completed backup files currently stored on the server.
     */
    public function listBackups()
    {
        $files = Storage::disk('local')->files('backups');
        $backups = array_map(function($file) {
            return [
                'name' => basename($file),
                'size' => round(Storage::disk('local')->size($file) / 1024 / 1024, 2) . ' MB',
                'created_at' => date('Y-m-d H:i:s', Storage::disk('local')->lastModified($file)),
                'path' => $file
            ];
        }, $files);

        // Sort by most recent first
        usort($backups, function($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        return response()->json([
            'success' => true,
            'backups' => $backups
        ]);
    }
}
