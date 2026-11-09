<!DOCTYPE html>
<html>
<head>
    <title>Backup Notification</title>
</head>
<body>
    <h1>Backup {{ ucfirst($status) }}</h1>
    <p><strong>Type:</strong> {{ ucfirst($type) }}</p>
    <p><strong>Date:</strong> {{ now()->toDateTimeString() }}</p>

    @if($status === 'success')
        <p>The backup was completed successfully.</p>
        @if($cloudUrl)
            <p><strong>Cloud Storage:</strong> <a href="{{ $cloudUrl }}">Download from Cloud</a></p>
        @else
            <p style="color: orange;">Note: Cloud upload was skipped or failed.</p>
        @endif

        @if($filePath)
            <p><strong>Local Server Path:</strong> {{ $filePath }}</p>
        @endif
    @else
        <p style="color: red;"><strong>Error:</strong> {{ $error }}</p>
    @endif

    <p>Retention Policy: Backups older than 30 days are automatically removed.</p>
</body>
</html>
