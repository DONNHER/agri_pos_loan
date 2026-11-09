<?php

namespace App\Services;
use Illuminate\Support\Facades\Artisan;
use App\Models\SiteSetting;
use App\Mail\BackupNotificationMail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use ZipArchive;
use Exception;

/**
 * Class BackupService
 * 
 * Logic for automating system backups. 
 * Supports Database SQL dumps, File Upload archiving, and Full System snapshots.
 */
class BackupService
{
    public function __construct()
    {
        // ResendService removed
    }

    /**
     * Entry point to run a specific backup task.
     */
    public function run($type = 'db')
    {
        $filename = "";
        try {
            switch ($type) {
                case 'db':
                    $filename = $this->backupDatabase();
                    break;
                case 'files':
                    $filename = $this->backupFiles();
                    break;
                case 'full':

                    Log::info('Starting full backup...');

                    Artisan::call('backup:run', [
                        '--only-to-disk' => 'dropbox',
                    ]);

                    Log::info(Artisan::output());

                    $this->notify(
                        'success',
                        'full',
                        'Disk Backup',
                        null,
                        null
                    );

                    return [
                        'success' => true,
                        'filename' => 'Disk Backup',
                        'output' => Artisan::output(),
                    ];

                break;
                default:
                    throw new Exception("Invalid backup type: $type");
            }

            if (!$this->verifyIntegrity($filename)) {
                throw new Exception("Backup integrity verification failed for $filename");
            }

            // 🚀 Log local backup success and size for verification
            $fileSizeMB = round(filesize($filename) / 1024 / 1024, 2);
            Log::info("LOCAL BACKUP SUCCESS: $filename ($fileSizeMB MB)");

            // 🚀 Cloud Upload disabled (Local Only)
            // $cloudUrl = $this->uploadToCloud($filename);
            $cloudUrl = null;

            $this->notify('success', $type, $filename, null, $cloudUrl);
            $this->cleanup();

            return ['success' => true, 'filename' => $filename, 'cloud_url' => $cloudUrl, 'size' => $fileSizeMB];
        } catch (Exception $e) {
            Log::error("Backup Failed ($type): " . $e->getMessage());
            $this->notify('failure', $type, null, $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /*
    protected function uploadToCloud($localPath)
    {
        try {
            $filename = basename($localPath);
            $bucketName = env('AWS_BUCKET', 'backups');
            $supabaseUrl = str_replace('/storage/v1/s3', '', env('AWS_URL')); // Extract base URL
            $serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');

            if (!$serviceRoleKey) {
                throw new Exception("SUPABASE_SERVICE_ROLE_KEY is not set in .env");
            }

            // Supabase storage endpoint URL structure
            $url = "{$supabaseUrl}/storage/v1/object/{$bucketName}/backups/{$filename}";

            $client = new \GuzzleHttp\Client();
            $response = $client->request('POST', $url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $serviceRoleKey,
                    'apikey'        => $serviceRoleKey,
                    'Content-Type'  => 'application/octet-stream', // Generic binary stream
                ],
                'body' => fopen($localPath, 'r') // Stream the file directly
            ]);

            if ($response->getStatusCode() === 200) {
                Log::info("Backup uploaded to Supabase: backups/$filename");
                // Construct the public URL (assuming the bucket is public or reachable)
                return "{$supabaseUrl}/storage/v1/object/public/{$bucketName}/backups/{$filename}";
            }

            throw new Exception("Supabase upload failed with status code: " . $response->getStatusCode());
        } catch (Exception $e) {
            Log::error("Supabase cloud upload failed: " . $e->getMessage());
            return null; // Don't fail the whole backup if cloud upload fails, but notify
        }
    }
    */

    protected function backupDatabase()
    {
        $dbConfig = config('database.connections.pgsql');
        $filename = 'backups/db_backup_' . date('Y-m-d_H-i-s') . '.sql';
        $fullPath = storage_path('app/' . $filename);

        if (!file_exists(storage_path('app/backups'))) {
            mkdir(storage_path('app/backups'), 0755, true);
        }

        $command = sprintf(
            'PGPASSWORD=%s pg_dump -h %s -p %s -U %s %s > %s 2>&1',
            escapeshellarg($dbConfig['password']),
            escapeshellarg($dbConfig['host']),
            escapeshellarg($dbConfig['port']),
            escapeshellarg($dbConfig['username']),
            escapeshellarg($dbConfig['database']),
            escapeshellarg($fullPath)
        );

        exec($command, $output, $returnVar);
        if ($returnVar !== 0) {
            $errorDetail = implode("\n", $output);
            Log::error("Database dump failed: " . $errorDetail);
            throw new Exception("Database dump failed: " . $errorDetail);
        }

        return $fullPath;
    }

    protected function backupFiles()
    {
        $filename = 'backups/files_backup_' . date('Y-m-d_H-i-s') . '.zip';
        $fullPath = storage_path('app/' . $filename);
        if (!file_exists(storage_path('app/backups'))) mkdir(storage_path('app/backups'), 0755, true);
        return $this->createZip(storage_path('app/public'), $fullPath);
    }

    protected function backupFullSystem()
    {
        $filename = 'backups/full_system_backup_' . date('Y-m-d_H-i-s') . '.zip';
        $fullPath = storage_path('app/' . $filename);
        if (!file_exists(storage_path('app/backups'))) mkdir(storage_path('app/backups'), 0755, true);
        return $this->createZip(base_path(), $fullPath, true);
    }

    protected function createZip($source, $destination, $isFull = false)
    {
        $zip = new ZipArchive();
        if ($zip->open($destination, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
            throw new Exception("Cannot create zip file");
        }

        if (is_dir($source)) {
            $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($source), \RecursiveIteratorIterator::LEAVES_ONLY);
            foreach ($files as $name => $file) {
                if (!$file->isDir()) {
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen($source) + 1);

                    // 🚀 Optimized Exclusions for Full Backups
                    if ($isFull && (
                        str_contains($relativePath, 'vendor') ||
                        str_contains($relativePath, 'node_modules') ||
                        str_contains($relativePath, '.git') ||
                        str_contains($relativePath, 'storage/app/backups')
                    )) continue;

                    $zip->addFile($filePath, $relativePath);
                }
            }
        }
        $zip->close();
        return $destination;
    }

    protected function verifyIntegrity($filePath)
    {
        return file_exists($filePath) && filesize($filePath) > 0;
    }

    protected function notify($status, $type, $filePath = null, $error = null, $cloudUrl = null)
    {
        try {
            // 🚀 Check Site Settings for notification preference
            $shouldNotify = $status === 'success'
                ? SiteSetting::get('backup_notify_success', true)
                : SiteSetting::get('backup_notify_failure', true);

            if (!$shouldNotify) {
                Log::info("Backup notification skipped based on site settings ($status).");
                return;
            }

            $adminEmail = env('MAIL_FROM_ADDRESS', 'noreply@lending-pis.com');
            Mail::to($adminEmail)->send(new BackupNotificationMail($status, $type, $filePath, $error, $cloudUrl));
        } catch (\Exception $e) {
            Log::error("Failed to send backup notification: " . $e->getMessage());
        }
    }

    public function cleanup()
    {
        $retentionDays = 30;
        Log::info("Running backup cleanup (Retention: $retentionDays days)");
        $files = Storage::disk('local')->files('backups');
        $deletedCount = 0;

        foreach ($files as $file) {
            $lastModified = Storage::disk('local')->lastModified($file);
            if (now()->timestamp - $lastModified > ($retentionDays * 24 * 60 * 60)) {
                Log::info("Deleting old backup: $file");
                Storage::disk('local')->delete($file);
                $deletedCount++;
            }
        }

        if ($deletedCount > 0) {
            Log::info("Cleanup completed. Deleted $deletedCount old backup(s).");
        }
    }
}
