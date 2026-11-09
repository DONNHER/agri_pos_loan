<?php

namespace App\Imports;

use App\Models\Transaction;
use App\Models\Shareholder;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;

class TransactionsImport implements ToCollection, WithHeadingRow
{
    public array $errors = [];
    public bool $isPreview = false;
    public int $successCount = 0;
    public int $failureCount = 0;

    public function collection(Collection $rows)
    {
        $validated = $this->validateData($rows->toArray());

        $this->errors = $validated['errors'];
        $this->failureCount = count($validated['errors']);

        if (!$this->isPreview) {
            foreach ($validated['valid'] as $row) {
                try {
                    $this->createTransaction($row);
                    $this->successCount++;
                } catch (\Exception $e) {
                    $this->failureCount++;
                    $this->errors[] = [
                        'row' => $row['row_number'] ?? 0,
                        'messages' => [$e->getMessage()],
                        'data' => $row
                    ];
                }
            }
        } else {
            $this->successCount = count($validated['valid']);
        }
    }

    public function validateData(array $rows)
    {
        $valid = [];
        $errors = [];
        $seenReferenceIds = []; // Track duplicates within the same batch upload

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            // Mapping Layer
            $data = [
                'shareholder_name' => $row['client'] ?? null,
                'reference_id'     => (string)($row['transaction_id'] ?? ''),
                'type'             => $this->mapCsvType($row['type'] ?? ''),
                'method'           => $this->mapCsvMethod($row['method'] ?? ''),
                'amount'           => $row['amount'] ?? 0,
                'status'           => $this->mapCsvStatus($row['status'] ?? ''),
                'row_number'       => $rowNumber,
            ];

            $validator = Validator::make($data, [
                'shareholder_name' => 'required',
                'reference_id'     => 'required|string',
                'type'             => 'required|in:deposit,withdrawal,payment,fee',
                'method'           => 'required|in:cash,bank_transfer,online',
                'amount'           => 'required|numeric|min:0',
                'status'           => 'required|in:completed,pending,failed',
            ]);

            if ($validator->fails()) {
                $errors[] = [
                    'row' => $rowNumber,
                    'messages' => $validator->errors()->all(),
                    'data' => $row
                ];
                continue;
            }

            // Check if reference_id already exists in Database or within this same spreadsheet batch
            $existsInDb = Transaction::where('reference_id', $data['reference_id'])->exists();
            $existsInBatch = in_array($data['reference_id'], $seenReferenceIds);

            if ($existsInDb || $existsInBatch) {
                $errors[] = [
                    'row' => $rowNumber,
                    'messages' => ["Duplicate Ref ID: Transaction reference '{$data['reference_id']}' already exists."],
                    'data' => $row
                ];
                continue;
            }

            $seenReferenceIds[] = $data['reference_id'];
            $valid[] = $data;
        }

        return ['valid' => $valid, 'errors' => $errors];
    }

    private function mapCsvType($type) {
        $map = ['loan repayment' => 'payment', 'capital contribution' => 'deposit', 'loan disbursement' => 'withdrawal'];
        return $map[strtolower($type)] ?? 'fee';
    }

    private function mapCsvMethod($method) {
        $m = strtolower($method);
        if (str_contains($m, 'cash')) return 'cash';
        return in_array($m, ['bank_transfer', 'online']) ? $m : 'cash';
    }

    private function mapCsvStatus($status) {
        return strtolower($status) === 'successful' ? 'completed' : 'failed';
    }

    private function createTransaction($row)
    {
        // Search by full name concatenation
        $shareholder = Shareholder::whereHas('user', function($q) use ($row) {
            $q->whereRaw("CONCAT(firstname, ' ', lastname) = ?", [$row['shareholder_name']]);
        })->first();

        if ($shareholder) {
            Transaction::create([
                'shareholder_id' => $shareholder->id,
                'reference_id'   => $row['reference_id'],
                'type'           => $row['type'],
                'method'         => $row['method'],
                'amount'         => $row['amount'],
                'status'         => $row['status'],
                'date'           => now(),
            ]);
        } else {
            throw new \Exception("Shareholder '{$row['shareholder_name']}' not found in the database.");
        }
    }
}