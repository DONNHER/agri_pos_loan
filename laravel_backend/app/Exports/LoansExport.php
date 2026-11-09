<?php

namespace App\Exports;

use App\Models\Loan;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Carbon\Carbon;

class LoansExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        // Sort by newest loans first
        return Loan::with('shareholder.user')->orderBy('id', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Shareholder',
            'Principal Amount',
            'Interest Rate (%)',
            'Tenure (Months)',
            'Monthly Amortization',
            'Remaining Balance',
            'Status',
            'Next Repayment Date',
            'Release Date',
        ];
    }

    public function map($loan): array
    {
        // 🎯 SAFE WRAPPER: Map the name out of schema properties safely
        $shareholderName = 'N/A';
        if ($loan->shareholder && $loan->shareholder->user) {
            $user = $loan->shareholder->user;
            $fullName = trim(($user->firstname ?? '') . ' ' . ($user->lastname ?? ''));
            $shareholderName = !empty($fullName) ? $fullName : ($user->username ?? $user->email);
        }

        return [
            $loan->id,
            $shareholderName,
            $loan->principal_amount ?? 0,
            $loan->interest_rate ?? 0,
            $loan->tenure_months ?? 0,
            $loan->monthly_amortization ?? 0,
            $loan->remaining_balance ?? 0,
            strtoupper($loan->status ?? 'PENDING'),
            // 🎯 SAFE WRAPPER: Check if timestamp exists and parse safely via Carbon instance
            $loan->next_repayment_date ? Carbon::parse($loan->next_repayment_date)->toDateString() : 'N/A',
            $loan->release_date ? Carbon::parse($loan->release_date)->toDateTimeString() : 'N/A',
        ];
    }
}