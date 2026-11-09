<?php

namespace App\Exports;

use App\Models\ActivityLog;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ActivityLogsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        // 🎯 Eager load user and sort by id desc to see recent logs first
        return ActivityLog::with('user')->orderBy('id', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'User',
            'Action',
            'Type',
            'Description',
            'IP Address',
            'Suspicious',
            'Created At',
        ];
    }

    public function map($log): array
    {
        // 🎯 SAFE WRAPPER: Handle user name formatting safely
        $userName = 'System';
        if ($log->user) {
            $fullName = trim(($log->user->firstname ?? '') . ' ' . ($log->user->lastname ?? ''));
            $userName = !empty($fullName) ? $fullName : ($log->user->username ?? $log->user->email);
        }

        return [
            $log->id,
            $userName,
            $log->action ?? 'N/A',
            strtoupper($log->log_type ?? 'INFO'),
            $log->description ?? 'N/A',
            $log->ip_address ?? 'N/A',
            $log->is_suspicious ? 'YES' : 'NO',
            $log->created_at ? $log->created_at->toDateTimeString() : 'N/A',
        ];
    }
}