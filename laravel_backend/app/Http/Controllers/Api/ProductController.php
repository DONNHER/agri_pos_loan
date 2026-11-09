<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\GroceryBatch;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $searchable = ['name', 'description', 'category', 'unit'];
        $query = Product::query();

        if ($request->boolean('trashed_only')) {
            $query->onlyTrashed();
        } elseif ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        // ✅ FIXED: Removed redundant $query argument
        $query->applyControls($request, $searchable);

        return response()->json(Product::getPaginatedResponse($query, $request));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'selling_price' => 'required|numeric',
            'unit' => 'required|string',
        ]);

        $product = Product::create($request->all());
        return response()->json([
            'success' => true, 
            'message' => 'Product created successfully', 
            'data' => $product
        ], 201);
    }

    public function show($id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        
        $auditTrail = ActivityLog::where('description', 'like', "%products (ID: {$id})%")
            ->latest('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true, 
            'data' => $product,
            'audit_trail' => $auditTrail
        ]);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $request->validate(['version' => 'required|integer']);

        try {
            $product->version = $request->version;
            $product->update($request->all());

            return response()->json([
                'success' => true, 
                'message' => 'Product updated successfully', 
                'data' => $product
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 409);
        }
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $hasStock = $product->batches()->where('remaining_quantity', '>', 0)->exists();
        
        if ($hasStock && !request()->boolean('force')) {
            return response()->json([
                'success' => false,
                'requires_confirmation' => true,
                'message' => 'This product has active stock. Proceed?'
            ], 409);
        }

        $product->delete();
        return response()->json(['success' => true, 'message' => 'Product soft-deleted successfully']);
    }

    public function restore($id)
    {
        $product = Product::onlyTrashed()->findOrFail($id);
        $product->restore();
        return response()->json(['success' => true, 'message' => 'Product restored successfully', 'data' => $product]);
    }

    public function bulkAction(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string|in:delete,restore,update_status,export',
            'status' => 'required_if:action,update_status'
        ]);

        $ids = $request->ids;

        switch ($request->action) {
            case 'delete':
                Product::whereIn('id', $ids)->delete();
                return response()->json(['success' => true, 'message' => count($ids) . ' products deleted.']);
            case 'restore':
                Product::onlyTrashed()->whereIn('id', $ids)->restore();
                return response()->json(['success' => true, 'message' => count($ids) . ' products restored.']);
            case 'update_status':
                Product::whereIn('id', $ids)->update(['status' => $request->status]);
                return response()->json(['success' => true, 'message' => 'Status updated.']);
            case 'export':
                return $this->export($request, $ids);
        }
    }

    public function export(Request $request, $ids = null)
    {
        $query = Product::query();
        if ($ids) {
            $query->whereIn('id', $ids);
        } else {
            // ✅ FIXED
            $query->applyControls($request, ['name', 'category']);
        }

        $products = $query->get();
        return response()->json(['success' => true, 'message' => 'Export logic placeholder']);
    }

    public function getBatches($id)
    {
        $batches = GroceryBatch::where('product_id', $id)->latest()->get();
        return response()->json(['success' => true, 'data' => $batches]);
    }
}
