<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationController extends Controller
{
    /**
     * Get notifications for a specific shareholder
     */
    public function index(Request $request)
    {
        $request->validate([
            'shareholder_id' => 'required|exists:shareholders,id'
        ]);

        try {
            $notifications = Notification::where('shareholder_id', $request->shareholder_id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $notifications
            ]);
        } catch (\Exception $e) {
            Log::error("Error fetching notifications: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to fetch notifications'], 500);
        }
    }
    /**
     * Delete all notifications for a shareholder
     */
    public function destroyAll(Request $request)
    {
        $request->validate(['shareholder_id' => 'required|exists:shareholders,id']);

        try {
            Notification::where('shareholder_id', $request->shareholder_id)->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error("Error deleting notifications: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete notifications'], 500);
        }
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead($id)
    {
        try {
            $notification = Notification::findOrFail($id);
            $notification->update(['is_unread' => false]);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
        }
    }

    public function markAllAsRead(Request $request)
    {
        $request->validate(['shareholder_id' => 'required|exists:shareholders,id']);

        Notification::where('shareholder_id', $request->shareholder_id)
            ->where('is_unread', true)
            ->update(['is_unread' => false]);

        return response()->json(['success' => true]);
    }

    /**
     * Trigger an email from the app using Supabase SMTP
     */
    public function sendEmail(Request $request)
    {
        $request->validate([
            'to' => 'required|email',
            'subject' => 'required|string',
            'message' => 'required|string',
        ]);

        try {
            $emailTo = $request->to;
            $subject = $request->subject;
            $content = $request->message;

            Mail::send([], [], function ($message) use ($emailTo, $subject, $content) {
                $message->to($emailTo)
                    ->subject($subject)
                    ->html("<div style='font-family: sans-serif; line-height: 1.5;'><h2>Notification</h2><p>" . nl2br(e($content)) . "</p></div>");
            });

            return response()->json(['success' => true, 'message' => 'Email sent successfully']);
        } catch (\Exception $e) {
            Log::error("Notification Email Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to send email'], 500);
        }
    }
}
