<!DOCTYPE html>
<html>
<head>
    <title>Verification Code</title>
</head>
<body>
    <h1>Hello, {{ $user->firstname }}!</h1>
    <p>Your multi-factor authentication code is: <strong>{{ $code }}</strong></p>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this code, please ignore this email.</p>
</body>
</html>
