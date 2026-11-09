<!DOCTYPE html>
<html>
<head>
    <title>Welcome to EngrCanteen Lending</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 80%; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
        .header { background-color: #C06C4D; color: white; padding: 10px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 0.8em; color: #777; margin-top: 20px; }
        .credentials { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #C06C4D; }
        .note { color: #d9534f; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to EngrCanteen Lending</h1>
        </div>
        <div class="content">
            <p>Hello {{ $user->firstname }},</p>
            <p>Your shareholder account has been successfully created. You can now access our lending platform to manage your shares and view loan opportunities.</p>
            
            <p><strong>To activate your account, please log in using the credentials below:</strong></p>
            
            <div class="credentials">
                <p><strong>Email:</strong> {{ $user->email }}</p>
                <p><strong>Temporary Password:</strong> {{ $temporaryPassword }}</p>
            </div>

            <p class="note">Note: You will be required to change your password immediately after your first login for security purposes.</p>

            <p>Guide to get started:</p>
            <ol>
                <li>Open the EngrCanteen Lending app.</li>
                <li>Enter your email and the temporary password provided above.</li>
                <li>Follow the prompts to set your new permanent password.</li>
                <li>Set up your Multi-Factor Authentication (MFA) for enhanced security.</li>
            </ol>

            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The EngrCanteen Team</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} EngrCanteen Lending System. All rights reserved.
        </div>
    </div>
</body>
</html>
