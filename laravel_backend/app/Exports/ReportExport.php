<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Report' }}</title>
    <style>
        @page { margin: 25mm 16mm 22mm 16mm; }

        body {
            /* 'DejaVu Sans' is the standard for DomPDF to ensure rendering consistency */
            font-family: 'DejaVu Sans', Helvetica, Arial, sans-serif;
            color: #111827;
            font-size: 9pt;
            line-height: 1.45;
        }

        .header {
            position: fixed;
            top: -20mm;
            left: 0;
            right: 0;
            height: 15mm;
            border-bottom: 2px solid #c06c4d;
            padding-bottom: 5px;
        }

        .brand-table { width: 100%; border-collapse: collapse; }

        .brand-box {
            background: #1f2937;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 11pt;
            display: inline-block;
        }

        .meta { color: #6b7280; font-size: 8pt; margin-top: 5px; }

        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            table-layout: fixed;
        }

        table.data-table th, table.data-table td {
            border: 1px solid #e5e7eb;
            padding: 6px;
            text-align: left;
            vertical-align: middle;
            word-wrap: break-word;
        }

        table.data-table th {
            background: #f3f4f6;
            font-weight: 700;
            font-size: 8pt;
            text-transform: uppercase;
        }

        .text-success { color: #047857; font-weight: bold; }
        .text-danger { color: #b91c1c; font-weight: bold; }

        .summary { margin-bottom: 15px; }
        .summary-item {
            display: inline-block;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background: #f9fafb;
            padding: 6px 10px;
            min-width: 140px;
        }

        .footer {
            position: fixed;
            bottom: -10mm;
            left: 0;
            right: 0;
            font-size: 8pt;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 6px;
        }

        .page-number:before { content: counter(page); }
    </style>
</head>
<body>
    <div class="header">
        <table class="brand-table">
            <tr>
                <td><div class="brand-box">CAPSTONE LENDING SYSTEM</div></td>
                <td style="text-align: right; font-weight: bold; font-size: 12pt; color: #374151;">{{ $title ?? 'Report' }}</td>
            </tr>
        </table>
        <div class="meta">
            Generated on {{ $generatedAt ?? now()->toDateTimeString() }} · {{ $subtitle ?? 'Business Report' }}
        </div>
    </div>

    @if(!empty($summary))
        <div class="summary">
            @foreach($summary as $item)
                <div class="summary-item">
                    <span style="color: #6b7280; font-size: 8pt;">{{ $item['label'] ?? '' }}</span><br>
                    <strong>{{ $item['value'] ?? '' }}</strong>
                </div>
            @endforeach
        </div>
    @endif

    @if(!empty($rows))
        <table class="data-table">
            <thead>
                <tr>
                    @foreach($headers as $header)
                        {{-- FIXED: Changed @elif to @elseif --}}
                        <th style="@if($header == 'ID') width: 15%; @elseif($header == 'Amount') width: 13%; @endif">
                            {{ $header }}
                        </th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $row)
                    <tr>
                        <td style="font-family: monospace; font-size: 7.5pt;">{{ $row['id'] ?? 'N/A' }}</td>
                        <td>{{ $row['reference_id'] ?? 'N/A' }}</td>
                        <td>{{ $row['shareholder'] ?? 'N/A' }}</td>
                        <td>{{ $row['type'] ?? 'N/A' }}</td>
                        <td>{{ $row['method'] ?? 'N/A' }}</td>
                        <td style="font-weight: bold;">{{ $row['amount'] ?? '0.00' }}</td>
                        <td class="@if(isset($row['status']) && $row['status'] == 'SUCCESSFUL') text-success @else text-danger @endif">
                            ● {{ $row['status'] ?? 'N/A' }}
                        </td>
                        <td style="font-size: 8pt; color: #4b5563;">{{ $row['date'] ?? 'N/A' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div style="padding: 20px; text-align: center; border: 1px dashed #d1d5db; border-radius: 6px;">
            No data available for this report.
        </div>
    @endif

    <div class="footer">
        <table style="width: 100%;">
            <tr>
                <td>Confidential Business Document · Printed via Secure Administration Portal</td>
                <td style="text-align: right;">Page <span class="page-number"></span></td>
            </tr>
        </table>
    </div>
</body>
</html>