<?php

namespace App\Imports;
use Illuminate\Support\Facades\DB;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;

class UsersImport implements ToCollection, WithHeadingRow
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

        // If it's a preview, valid rows count toward expected successes
        // If it's a real run, we actually create the records
        if (!$this->isPreview) {
            foreach ($validated['valid'] as $row) {
                try {
                    $this->createUser($row);
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

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            // Mapping CSV keys (which include spaces) to internal keys
            $data = [
                'username'  => $row['username'] ?? null,
                'email'     => $row['email'] ?? null,
                'firstname' => $row['first_name'] ?? null,
                'lastname'  => $row['last_name'] ?? null,
                'role'      => strtolower($row['role'] ?? ''),
                'status'    => strtolower($row['status'] ?? ''),
                'row_number' => $rowNumber,
            ];

            $validator = Validator::make($data, [
                'username'  => 'required|string',
                'email'     => 'required|email',
                'firstname' => 'required|string',
                'lastname'  => 'required|string',
                'role'      => 'required|in:admin,staff,member,shareholder',
                'status'    => 'required|in:active,inactive,suspended,pending',
            ]);

            if ($validator->fails()) {
                $errors[] = [
                    'row' => $rowNumber,
                    'messages' => $validator->errors()->all(),
                    'data' => $row
                ];
                continue;
            }

            // Duplicate check (against DB and previously collected valid batch items)
            $existsInDb = User::where('username', $data['username'])
                ->orWhere('email', $data['email'])
                ->exists();

            $existsInBatch = collect($valid)->contains(function ($item) use ($data) {
                return $item['username'] === $data['username'] || $item['email'] === $data['email'];
            });

            if ($existsInDb || $existsInBatch) {
                $errors[] = [
                    'row' => $rowNumber,
                    'messages' => ["Username or Email already exists."],
                    'data' => $row
                ];
                continue;
            }

            $valid[] = $data;
        }

        return ['valid' => $valid, 'errors' => $errors];
    }


     private function createUser($row)
     {
         DB::transaction(function () use ($row) {
             User::create([
                 'username'  => $row['username'],
                 'email'     => $row['email'],
                 'password'  => Hash::make('password123'),
                 'firstname' => $row['firstname'],
                 'lastname'  => $row['lastname'],
                 'role'      => $row['role'],
                 'status'    => $row['status'],
             ]);
         });
     }
}