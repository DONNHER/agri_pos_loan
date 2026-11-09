<?php

namespace App\Exports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TransactionsExport implements FromCollection, WithHeadings, WithMapping
{
    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        // 🎯 FIX: Changed 'created_at' to 'date' here too to stop the XLSX export from crashing
        return Transaction::with('shareholder.user')->orderBy('date', 'desc')->get();
    }

    /**
    * @var Transaction $transaction
    */
    public function map($transaction): array
    {
        return [
            $transaction->id,
            $transaction->reference_id ?? 'N/A',
            $transaction->shareholder?->user?->fullName ?? 'N/A',
            strtoupper($transaction->type ?? 'N/A'),
            strtoupper($transaction->method ?? 'N/A'),
            $transaction->amount,
            strtoupper($transaction->status),
            $transaction->date ? $transaction->date->toDateTimeString() : 'N/A',
        ];
    }

    public function headings(): array
    {
        return [
            'ID',
            'Reference ID',
            'Shareholder',
            'Type',
            'Method',
            'Amount',
            'Status',
            'Date',
        ];
    }
}