<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ArchiveOldLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:archive';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive activity logs older than 90 days to cloud storage and remove from database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoffDate = Carbon::now()->subDays(90);
        $this->info("Looking for logs older than: " . $cutoffDate->toDateString());

        $logsToArchive = ActivityLog::where('created_at', '<', $cutoffDate)->get();
        $count = $logsToArchive->count();

        if ($count === 0) {
            $this->info("No logs found to archive.");
            return;
        }

        $this->info("Found $count logs. Generating archive file...");

        $filename = "archives/logs_archive_" . Carbon::now()->format('Y-m-d_H-i-s') . ".json";
        $content = json_encode($logsToArchive, JSON_PRETTY_PRINT);

        try {
            // 🚀 1. Upload to Supabase/Cloud Storage (S3 disk)
            Storage::disk('s3')->put($filename, $content);
            $this->info("Archive uploaded to Supabase: $filename");

            // 🚀 2. Also keep a local copy for safety
            Storage::disk('local')->put($filename, $content);

            // 🚀 3. Remove from Database
            ActivityLog::where('created_at', '<', $cutoffDate)->delete();
            $this->info("Database successfully purged of archived logs.");

            Log::info("Log Archival Successful: Archived $count logs to $filename");
        } catch (\Exception $e) {
            $this->error("Archival failed: " . $e->getMessage());
            Log::error("Log Archival Failed: " . $e->getMessage());
        }
    }
}
