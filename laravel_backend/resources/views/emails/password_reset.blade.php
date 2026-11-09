<!DOCTYPE html>
<html>
<head>
    <title>Password Reset Code</title>
</head>
<body>
    <h1>Hello, {{ $user->firstname }}!</h1>
    <p>You are receiving this email because we received a password reset request for your account.</p>
    <p>Your password reset code is: <strong>{{ $code }}</strong></p>
    <p>This code will expire in 15 minutes.</p>
    <p>If you did not request a password reset, no further action is required.</p>
</body>
</html>
