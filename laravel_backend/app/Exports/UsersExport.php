<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class UsersExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        // Order by ID descending so newly registered users appear at the top
        return User::orderBy('id', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Username',
            'Email',
            'First Name',
            'Last Name',
            'Role',
            'Status',
            'Created At',
        ];
    }

    public function map($user): array
    {
        return [
            $user->id,
            $user->username ?? 'N/A',
            $user->email,
            $user->firstname ?? 'N/A',
            $user->lastname ?? 'N/A',
            strtoupper($user->role ?? 'USER'),
            strtoupper($user->status ?? 'ACTIVE'),
            // 🎯 SAFE WRAPPER: Avoids "Call to a member function toDateTimeString() on null"
            $user->created_at ? $user->created_at->toDateTimeString() : 'N/A',
        ];
    }
}