<?php

namespace App\Imports;

use App\Models\Loan;
use App\Models\Shareholder;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;

class LoansImport implements ToCollection, WithHeadingRow
{
    public array $errors = [];
    public bool $isPreview = false;
    public int $successCount = 0;
    public int $failureCount = 0;

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $data = $row->toArray();

            // 1. Data Validation
            $validator = Validator::make($data, [
                'shareholder'      => 'required|string',
                'principal_amount' => 'required|numeric|min:0',
                'interest_rate'    => 'required|numeric|min:0',
                'tenure_months'    => 'required|integer|min:1',
                'status'           => 'required|string',
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

            // 2. Resolve Shareholder First (needed for duplicate checking & creation)
            $shareholder = Shareholder::whereHas('user', function($q) use ($data) {
                $q->whereRaw("CONCAT(firstname, ' ', lastname) LIKE ?", ["%{$data['shareholder']}%"]);
            })->first();

            if (!$shareholder) {
                $this->failureCount++;
                $this->errors[] = [
                    'row' => $rowNumber,
                    'messages' => ["Shareholder '{$data['shareholder']}' not found in the database."],
                    'data' => $data
                ];
                continue;
            }

            // 3. Duplicate Detection & Handling
            // (Example rule: A duplicate loan has the same shareholder, principal amount, and tenure)
            $exists = Loan::where('shareholder_id', $shareholder->id)
                ->where('principal_amount', $data['principal_amount'])
                ->where('tenure_months', $data['tenure_months'])
                ->exists();

            if ($exists && $this->isPreview === false) { // Handle behavior depending on whether duplicates are blocked or updated
                // Note: If you want updateOrCreate to handle it gracefully, you can let it pass,
                // but if you want to flag duplicates as validation errors:
                $this->failureCount++;
                $this->errors[] = [
                    'row' => $rowNumber,
                    'messages' => ["Duplicate Entry: A matching loan for this shareholder already exists."],
                    'data' => $data
                ];
                continue;
            }

            // 4. If Preview or Save
            if (!$this->isPreview) {
                try {
                    $this->createLoan($data, $shareholder);
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
                // Count as successful for preview summary stats
                $this->successCount++;
            }
        }
    }

    private function createLoan($row, $shareholder)
    {
        $statusMap = ['FULLY PAID' => 'paid', 'ACTIVE' => 'active'];
        $status = $statusMap[strtoupper($row['status'])] ?? strtolower($row['status']);

        Loan::updateOrCreate(
            [
                'shareholder_id' => $shareholder->id,
                'principal_amount' => $row['principal_amount']
            ],
            [
                'interest_rate' => $row['interest_rate'],
                'tenure_months' => $row['tenure_months'],
                'remaining_balance' => $row['remaining_balance'] ?? $row['principal_amount'],
                'status' => $status,
                'release_date' => now(),
            ]
        );
    }
}