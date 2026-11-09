<!DOCTYPE html>
<html>
<head>
    <title>Security Alert</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #d9534f; text-align: center;">🚨 Security Alert: Account Locked</h2>
        <p>Hello Administrator,</p>
        <p>This is an automated notification to inform you that the following user account has been <strong>locked</strong> after reaching the maximum number of failed login attempts (5).</p>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>User:</strong> {{ $user->firstname }} {{ $user->lastname }}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> {{ $user->email }}</p>
            <p style="margin: 5px 0;"><strong>IP Address:</strong> {{ $ip }}</p>
            <p style="margin: 5px 0;"><strong>Timestamp:</strong> {{ now()->toDayDateTimeString() }}</p>
        </div>

        <p>The account will remain locked for 15 minutes. You may want to review the activity logs for this user to ensure no unauthorized access was attempted.</p>

        <p style="font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; margin-top: 30px;">
            This is an automated message from the PIL Point of Sale and Lending System. Please do not reply to this email.
        </p>
    </div>
</body>
</html>
