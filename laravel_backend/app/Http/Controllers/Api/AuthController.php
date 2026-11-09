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
use Illuminate\Support\Facades\Http;

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

    /**
         * 🚀 Helper to update password on Supabase Admin API to keep them in sync
         */
        private function updateSupabasePassword($email, $newPassword)
        {
            try {
                $supabaseUrl = env('SUPABASE_URL') ?? config('services.supabase.url');
                $serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY') ?? config('services.supabase.service_role_key');

                if (!$supabaseUrl || !$serviceRoleKey) {
                    Log::warning('Supabase environment variables (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) are missing. Skipping remote sync.');
                    return false;
                }

                // 1. Find Supabase User ID by Email using query parameters
                $searchResponse = Http::withHeaders([
                    'apikey' => $serviceRoleKey,
                    'Authorization' => 'Bearer ' . $serviceRoleKey,
                ])->get("{$supabaseUrl}/auth/v1/admin/users", [
                    'email' => $email
                ]);

                if (!$searchResponse->successful()) {
                    Log::error('Failed to fetch user from Supabase Admin API', ['response' => $searchResponse->body()]);
                    return false;
                }

                $users = $searchResponse->json('users') ?? [];
                $supabaseUserId = $users[0]['id'] ?? null;

                if (!$supabaseUserId) {
                    Log::warning('User not found in Supabase Auth during password sync', ['email' => $email]);
                    return false;
                }

                // 2. Update password via Supabase Admin API
                $updateResponse = Http::withHeaders([
                    'apikey' => $serviceRoleKey,
                    'Authorization' => 'Bearer ' . $serviceRoleKey,
                    'Content-Type' => 'application/json',
                ])->put("{$supabaseUrl}/auth/v1/admin/users/{$supabaseUserId}", [
                    'password' => $newPassword,
                    'email_confirm' => true
                ]);

                if (!$updateResponse->successful()) {
                    Log::error('Failed to update Supabase password via Admin API', ['response' => $updateResponse->body()]);
                    return false;
                }

                return true;
            } catch (\Exception $e) {
                Log::error('Exception during Supabase password sync: ' . $e->getMessage());
                return false;
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
                    'status' => 'pending',
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
                    'mfa_required' => true,
                    'email' => $user->email,
                    'message' => 'Registration successful. Please verify the code sent to your email.'
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
        Log::info('Laravel Password Reset Attempt initiated', [
            'email' => $request->input('email'),
            'ip' => $request->ip(),
        ]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'password' => $this->passwordPolicy,
        ], [
            'password.regex' => $this->passwordPolicyMessage
        ]);

        if ($validator->fails()) {
            Log::warning('Laravel Password Reset Validation Failed', ['errors' => $validator->errors()->toArray()]);
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                Log::warning('Laravel Password Reset Failed: User not found', ['email' => $request->email]);
                return response()->json(['success' => false, 'message' => 'User not found.'], 404);
            }

            // 🚀 Sync password change to Supabase Auth provider
            $this->updateSupabasePassword($request->email, $request->password);

            // 🚀 Update local MySQL bcrypt hash
            $user->update([
                'password' => Hash::make($request->password)
            ]);

            $this->logAuth($user, 'Password Reset Completed', $request);
            $this->notifyPasswordChange($user);

            Log::info('Laravel Password Reset Successful', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'Password has been successfully synchronized and updated.'
            ]);
        } catch (\Exception $e) {
            Log::error('Password reset sync failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to sync password: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'=>'required|email',
            'supabase_token'=>'required|string'
        ]);


        /*
         |--------------------------------------------------------------------------
         | Verify Supabase JWT
         |--------------------------------------------------------------------------
         */

        $supabaseUrl = env('SUPABASE_URL');

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_ANON_KEY'),
            'Authorization' => 'Bearer '.$request->supabase_token,
        ])->get(
            $supabaseUrl.'/auth/v1/user'
        );
        Log::info('Supabase token received', [
            'token_length' => strlen($request->supabase_token),
            'token_start' => substr($request->supabase_token,0,20)
        ]);

        Log::info('Supabase response', [
            'status'=>$response->status(),
            'body'=>$response->body()
        ]);


        if (!$response->successful()) {

            return response()->json([
                'success'=>false,
                'message'=>'Invalid Supabase token'
            ],401);

        }


        $supabaseUser = $response->json();


        /*
         |--------------------------------------------------------------------------
         | Find Laravel User using EMAIL
         |--------------------------------------------------------------------------
         */

       $user = User::where('email', $supabaseUser['email'])->first();

       if (!$user) {
           return response()->json([
               'success' => false,
               'message' => 'Laravel user not found'
           ], 404);
       }

       // Supabase has already confirmed this email (we verified the JWT above),
       // so sync the local status if it's still marked pending.
       if ($user->status === 'pending') {
           $user->update(['status' => 'active']);
       }

       $token = $user->createToken('mobile')->plainTextToken;

       return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->load('shareholder'),
                'accessToken' => $token,
                'refreshToken' => $token,
                'expiresIn' => 3600,
            ]
        ]);
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
            // 🚀 Sync password change to Supabase Auth provider
            $this->updateSupabasePassword($user->email, $request->new_password);

            // 🚀 Update local MySQL bcrypt hash
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
            $request->validate([
                'email' => 'required|email'
            ]);

            $email = $request->input('email');
            $user = User::where('email', $email)->first();

            if (!$user) {
                Log::warning('Laravel Forgot Password Failed: Email not found', ['email' => $email]);
                return response()->json([
                    'success' => true,
                    'message' => 'If this email exists, a password reset link has been processed.'
                ], 200);
            }

            try {
                $supabaseUrl = env('SUPABASE_URL') ?? config('services.supabase.url');
                $serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY') ?? config('services.supabase.service_role_key');

                if (!$supabaseUrl || !$serviceRoleKey) {
                    Log::error('Supabase credentials missing for password recovery trigger.');
                    return response()->json([
                        'success' => false,
                        'message' => 'Server configuration error.'
                    ], 500);
                }

                $response = Http::withHeaders([
                    'apikey' => $serviceRoleKey,
                    'Authorization' => 'Bearer ' . $serviceRoleKey,
                    'Content-Type' => 'application/json',
                ])->post("{$supabaseUrl}/auth/v1/recover", [
                    'email' => $email,
                    'redirect_to' => 'https://lendingpis-production.up.railway.app/PIS/#/change-password'
                ]);

                if (!$response->successful()) {
                    Log::error('Supabase Auth recover API failed', ['response' => $response->body()]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to trigger password recovery via Supabase Auth.'
                    ], 400);
                }

                $this->logAuth($user, 'Password Reset Request', $request);

                return response()->json([
                    'success' => true,
                    'message' => 'Password reset instructions have been dispatched.'
                ], 200);

            } catch (\Exception $e) {
                Log::error('Forgot password exception: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'An error occurred while processing the request.'
                ], 500);
            }
        }

    public function verifyMfa(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            Log::warning('Laravel Verify MFA Failed: User not found', ['email' => $request->input('email')]);
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        }

        $user->update(['status' => 'active']);

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        Log::info('Laravel Verify MFA Successful', ['user_id' => $user->id]);

        return response()->json(['success' => true, 'user' => $user->load('shareholder'), 'token' => $token]);
    }

    public function resendMfa(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        Log::info("MFA Resend requested for: " . $request->email);
        return response()->json(['success' => true, 'message' => 'Delivery is handled by Supabase.']);
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


