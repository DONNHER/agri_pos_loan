<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Shareholder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    protected $passwordPolicy = 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/';
    protected $passwordPolicyMessage = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';

    private function logAuth($user, $action, $request, $isSuspicious = false, $description = null)
    {
        try {
            ActivityLog::create([
                'user_id' => $user ? $user->id : null,
                'action' => $action,
                'log_type' => ActivityLog::TYPE_AUTH,
                'description' => $description ?? "Auth action: $action",
                'ip_address' => $request->ip(),
                'device_info' => $request->userAgent(),
                'is_suspicious' => $isSuspicious
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to log auth activity: " . $e->getMessage());
        }
    }

    private function notifyPasswordChange($user)
    {
        try {
            Notification::create([
                'user_id' => $user->id,
                'shareholder_id' => $user->shareholder ? $user->shareholder->id : null,
                'title' => 'Security Alert: Password Changed',
                'content' => 'Your account password has been successfully updated. If you did not make this change, please contact support immediately.',
                'category' => 'security',
                'type' => 'alert',
                'is_unread' => true,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to create password change notification: " . $e->getMessage());
        }
    }

    public function register(Request $request)
    {
        Log::info('Laravel Register Attempt initiated', [
            'email' => $request->input('email'),
            'username' => $request->input('username'),
            'ip' => $request->ip()
        ]);

        $validator = Validator::make($request->all(), [
            'username' => 'required|string|unique:users',
            'email' => 'required|string|email',
            'password' => $this->passwordPolicy,
            'firstname' => 'required|string',
            'lastname' => 'required|string',
            'role' => 'required|string',
            'avatar_url' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'id_image_url' => 'nullable|string',
        ], [
            'password.regex' => $this->passwordPolicyMessage
        ]);

        if ($validator->fails()) {
            Log::warning('Laravel Register Validation Failed', ['errors' => $validator->errors()->toArray()]);
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $user = User::create([
                    'username' => $request->username,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'firstname' => $request->firstname,
                    'lastname' => $request->lastname,
                    'role' => $request->role,
                    'status' => 'active',
                    'avatar_url' => $request->avatar_url,
                    'address' => $request->address,
                ]);

                if ($user->role === 'shareholder') {
                    Shareholder::create([
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'first_name' => $user->firstname,
                        'last_name' => $user->lastname,
                        'full_name' => $user->firstname . ' ' . $user->lastname,
                        'address' => $user->address,
                        'contact_number' => $request->phone ?? '',
                        'total_share_capital' => $request->input('initial_share', 0.00),
                        'creditscore' => 700,
                        'status' => 'active',
                        'id_image_url' => $request->id_image_url,
                    ]);
                }

                $this->logAuth($user, 'Register (Pending)', $request);

                Log::info('Laravel Register Successful', ['user_id' => $user->id, 'email' => $user->email]);

                return response()->json([
                    'success' => true,
                    'user' => $user->load('shareholder'),
                    'email' => $user->email,
                    'message' => 'Registration successful.'
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('Registration failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Email-based password recovery is disabled. Sign in and change your password, or contact an administrator.',
        ], 410);
    }

    public function login(Request $request)
    {
        return $this->loginPassword($request);
    }

    /**
     * Traditional email/password login
     */
    public function loginPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        if ($user->status === 'pending') {
            $user->update(['status' => 'active']);
        }

        $issuedToken = $user->createToken('mobile', ['*'], now()->addHours(12));
        $token = $issuedToken->plainTextToken;

        try {
            $local = DB::connection('sqlite');
            $local->getPdo();
            $userColumns = Schema::connection('sqlite')->getColumnListing('users');
            $userAttributes = array_intersect_key($user->getAttributes(), array_flip($userColumns));
            $local->table('users')->updateOrInsert(['id' => $user->id], $userAttributes);

            $tokenAttributes = $issuedToken->accessToken->getAttributes();
            $tokenColumns = Schema::connection('sqlite')->getColumnListing('personal_access_tokens');
            $tokenAttributes = array_intersect_key($tokenAttributes, array_flip($tokenColumns));
            $local->table('personal_access_tokens')->updateOrInsert(['id' => $issuedToken->accessToken->id], $tokenAttributes);
        } catch (\Throwable $error) {
            Log::warning('Could not cache authenticated POS user for offline use: ' . $error->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->load('shareholder'),
                'accessToken' => $token,
                'refreshToken' => $token, // Using same token for now
                'expiresIn' => 43200, // 12-hour terminal shift
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'firstname' => 'sometimes|string|max:255',
            'lastname' => 'sometimes|string|max:255',
            'address' => 'nullable|string',
            'avatar_url' => 'nullable|string',
            'id_image_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            Log::warning('Laravel Profile Update Validation Failed', ['errors' => $validator->errors()->toArray()]);
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $user->update($request->only([
                'firstname',
                'lastname',
                'avatar_url',
                'address',
            ]));

            if ($user->shareholder) {
                $user->shareholder->update([
                    'first_name' => $user->firstname,
                    'last_name' => $user->lastname,
                    'full_name' => $user->firstname . ' ' . $user->lastname,
                    'address' => $user->address,
                    'id_image_url' => $request->has('id_image_url') ? $request->id_image_url : $user->shareholder->id_image_url,
                ]);
            }

            Log::info('Laravel Profile Update Successful', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'user' => $user->load('shareholder'),
                'message' => 'Profile updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Profile update failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Failed to update profile'], 500);
        }
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => $this->passwordPolicy,
        ], [
            'new_password.regex' => $this->passwordPolicyMessage
        ]);

        if ($validator->fails()) {
            Log::warning('Laravel Change Password Validation Failed', ['errors' => $validator->errors()->toArray()]);
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            Log::warning('Laravel Change Password Failed: Current password mismatch', ['user_id' => $user->id]);
            return response()->json(['success' => false, 'message' => 'Current password does not match'], 400);
        }

        try {
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            $this->notifyPasswordChange($user);

            Log::info('Laravel Change Password Successful', ['user_id' => $user->id]);

            return response()->json(['success' => true, 'message' => 'Password changed successfully']);
        } catch (\Exception $e) {
            Log::error('Password change failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Failed to change password'], 500);
        }
    }

    public function forgotPassword(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Email-based password recovery is disabled. Contact an administrator.',
        ], 410);
    }

    public function verifyMfa(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Email-based MFA is disabled.',
        ], 410);
    }

    public function resendMfa(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Email-based MFA is disabled.',
        ], 410);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $this->logAuth($user, 'User Logout', $request);
            $currentToken = $user->currentAccessToken();
            $tokenId = $currentToken?->getKey();
            $currentToken?->delete();
            if ($tokenId) {
                try {
                    DB::connection('sqlite')->table('personal_access_tokens')->where('id', $tokenId)->delete();
                } catch (\Throwable $error) {
                    Log::warning('Could not revoke cached POS token during logout: ' . $error->getMessage());
                }
            }
            Log::info('Laravel Logout Successful', ['user_id' => $user->id]);
        }
        return response()->json(['success' => true, 'message' => 'Logged out']);
    }
}


