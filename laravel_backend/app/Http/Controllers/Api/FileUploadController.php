<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * Class FileUploadController
 * 
 * Handles file and image uploads for the application. 
 * Implements strict validation for file types, sizes, and dimensions.
 * 
 * @package App\Http\Controllers\Api
 */
class FileUploadController extends Controller
{
    /**
     * Upload a file to the server.
     * 
     * @param Request $request Expects 'file' and optional 'folder'.
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        try {
            // Requirement 12: File validation (Type, Size, Dimensions)
            $request->validate([
                'file' => [
                    'required',
                    'image',
                    'mimes:jpeg,png,jpg,gif',
                    'max:5120', // Max 5MB
                    'dimensions:min_width=100,min_height=100,max_width=4000,max_height=4000'
                ],
                'folder' => 'nullable|string|max:50'
            ]);

            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $folder = $request->input('folder', 'uploads');
                
                // Generate unique filename using UUID
                $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
                
                $disk = Storage::disk('s3');
                $path = $file->storeAs($folder, $fileName, 's3');
                $url = $disk->temporaryUrl($path, now()->addHour());

                return response()->json([
                    'success' => true,
                    'message' => 'File uploaded successfully',
                    'url' => $url,
                    'path' => $path
                ], 201);
            }

            return response()->json(['success' => false, 'message' => 'No file was provided'], 400);
        } catch (\Exception $e) {
            Log::error('Upload Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
