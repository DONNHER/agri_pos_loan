<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BackupService;
use Illuminate\Support\Facades\Log;

class WeeklyBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:weekly';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run weekly database backup and send to email/cloud storage';

    /**
     * Execute the console command.
     */
    public function handle(BackupService $backupService)
    {
        $this->info('Starting weekly database backup...');
        Log::info('Weekly backup process initiated.');

        $result = $backupService->run('db');

        if ($result['success']) {
            $this->info('Weekly backup completed successfully: ' . $result['filename']);
            Log::info('Weekly backup successful.');
        } else {
            $this->error('Weekly backup failed: ' . $result['error']);
            Log::error('Weekly backup failed.');
        }
    }
}
