<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BackupService;
use Illuminate\Support\Facades\Log;

class MonthlyFullBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:full';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run monthly full system backup (compressed archive) and send via email/cloud';

    /**
     * Execute the console command.
     */
    public function handle(BackupService $backupService)
    {
        $this->info('Starting monthly full system backup...');
        Log::info('Monthly full backup process initiated.');

        // 'full' type handles base_path() compression with exclusions (vendor, storage/backups)
        $result = $backupService->run('full');

        if ($result['success']) {
            $this->info('Monthly full backup completed successfully: ' . $result['filename']);
            Log::info('Monthly full backup successful.');
        } else {
            $this->error('Monthly full backup failed: ' . $result['error']);
            Log::error('Monthly full backup failed.');
        }
    }
}
