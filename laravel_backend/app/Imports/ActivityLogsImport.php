<?php

namespace App\Imports;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;

class ActivityLogsImport implements ToCollection, WithHeadingRow
{
    public bool $isPreview = false;
    public array $errors = [];
    public int $successCount = 0;
    public int $failureCount = 0;

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $data = $row->toArray();

            // Map CSV headers (Date, User, Action, Type, Details) to logic keys
            $mappedData = [
                'name'        => $row['user'] ?? null,
                'action'      => $row['action'] ?? null,
                'log_type'    => strtolower($row['type'] ?? ''),
                'description' => $row['details'] ?? null,
            ];

            // Validation: Ensure required fields and valid log types
            $validator = Validator::make($mappedData, [
                'name'        => 'required|string',
                'action'      => 'required|string',
                'log_type'    => 'required|in:auth,transaction,error,access,general',
                'description' => 'required|string',
            ]);

            if ($validator->fails()) {
                $this->failureCount++;
                $this->errors[] = [
                    'row' => $rowNumber,
                    'messages' => $validator->errors()->all(),
                    'data' => $data
                ];
                continue;
            }

            // Resolve User
            $user = User::where('name', $mappedData['name'])
                ->orWhere('firstname', $mappedData['name']) // Fallback if name is split or partial
                ->first();

            if (!$user) {
                $this->failureCount++;
                $this->errors[] = [
                    'row' => $rowNumber,
                    'messages' => ["User '{$mappedData['name']}' not found in the database."],
                    'data' => $data
                ];
                continue;
            }

            if (!$this->isPreview) {
                try {
                    ActivityLog::create([
                        'user_id'     => $user->id,
                        'action'      => $mappedData['action'],
                        'log_type'    => $mappedData['log_type'],
                        'description' => $mappedData['description'],
                        'ip_address'  => request()->ip() ?? '127.0.0.1',
                    ]);
                    $this->successCount++;
                } catch (\Exception $e) {
                    $this->failureCount++;
                    $this->errors[] = [
                        'row' => $rowNumber,
                        'messages' => [$e->getMessage()],
                        'data' => $data
                    ];
                }
            } else {
                // Count toward successful preview tally
                $this->successCount++;
            }
        }
    }
}