<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 15mm; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9pt; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background: #f3f4f6; text-transform: uppercase; }
        .summary { margin-bottom: 10px; display: flex; gap: 10px; }
        .summary-item { border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h2>{{ $title }}</h2>
    <p>{{ $subtitle }} | {{ $generatedAt }}</p>

    <div class="summary">
        @foreach($summary as $item)
            <div class="summary-item"><strong>{{ $item['label'] }}:</strong> {{ $item['value'] }}</div>
        @endforeach
    </div>

    <table>
        <thead>
            <tr>
                @foreach($headers as $header) <th>{{ $header }}</th> @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr>
                    <td>{{ $row['id'] }}</td>
                    <td>{{ $row['reference_id'] }}</td>
                    <td>{{ $row['shareholder'] }}</td>
                    <td>{{ $row['method'] }}</td>
                    <td>{{ $row['type'] }}</td>
                    <td>{{ $row['amount'] }}</td>
                    <td>{{ $row['status'] }}</td>
                    <td>{{ $row['date'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>