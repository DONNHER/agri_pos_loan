<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ErrorsExport implements FromArray, WithHeadings
{
    protected $errors;

    public function __construct(array $errors)
    {
        $this->errors = $errors;
    }

    public function array(): array
    {
        return array_map(function($error) {
            // 🎯 SAFE MAPPING: Handle potential JSON encoding issues
            $rawData = isset($error['data']) ? json_encode($error['data'], JSON_PRETTY_PRINT) : 'N/A';

            return [
                $error['row'] ?? 'Unknown',
                is_array($error['messages']) ? implode(', ', $error['messages']) : ($error['messages'] ?? 'Error'),
                $rawData
            ];
        }, $this->errors);
    }

    public function headings(): array
    {
        return [
            'Row Number',
            'Error Messages',
            'Original Data'
        ];
    }
}