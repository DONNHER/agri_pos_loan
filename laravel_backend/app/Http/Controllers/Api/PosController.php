<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Database\LocalDatabase;
use App\Services\Database\SyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PosController extends Controller
{
    public function __construct(
        private readonly LocalDatabase $localDatabase,
        private readonly SyncService $syncService
    ) {
    }

    public function catalog(Request $request): JsonResponse
    {
        $db = $this->localDatabase->requireReady();
        $products = $db->table('products')->where('is_active', true)->orderBy('product_name')->get();
        $productRows = $products->map(function ($product) use ($db): array {
            $stock = Schema::connection('sqlite')->hasTable('grocery_batches')
                ? (int) $db->table('grocery_batches')->where('product_id', $product->id)->sum('remaining_quantity')
                : 0;
            $cost = Schema::connection('sqlite')->hasTable('grocery_batches')
                ? (float) ($db->table('grocery_batches')->where('product_id', $product->id)->avg('capital_price') ?? 0)
                : 0;

            return [
                'id' => $product->id,
                'product_code' => $product->barcode ?: $product->id,
                'name' => $product->product_name,
                'category' => 'General',
                'unit' => 'unit',
                'price' => (int) round((float) $product->selling_price * 100),
                'cost' => (int) round($cost * 100),
                'stock_quantity' => $stock,
                'barcode' => $product->barcode,
                'image_url' => $product->product_image,
            ];
        });

        $query = $db->table('shareholders')->orderBy('full_name');
        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        $shareholders = $query->limit(100)->get()->map(function ($person): array {
            return [
                'id' => $person->id,
                'name' => $person->full_name ?: trim($person->first_name . ' ' . $person->last_name),
                'number' => $person->id,
                'creditLimit' => (int) ($person->credit_limit ?? 0),
                'currentBalance' => 0,
                'risk' => 'low',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => ['products' => $productRows, 'shareholders' => $shareholders],
        ]);
    }

    public function storeSale(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_uuid' => ['required', 'uuid'],
            'terminal_id' => ['required', 'string', 'max:100'],
            'cashier_id' => ['nullable', 'uuid'],
            'shareholder_id' => ['nullable', 'uuid'],
            'cart.lines' => ['required', 'array', 'min:1'],
            'cart.subtotal' => ['required', 'integer', 'min:0'],
            'cart.discount_total' => ['required', 'integer', 'min:0'],
            'cart.tax_total' => ['required', 'integer', 'min:0'],
            'cart.grand_total' => ['required', 'integer', 'min:0'],
            'cart.lines.*.product_id' => ['required', 'uuid'],
            'cart.lines.*.quantity' => ['required', 'integer', 'min:1'],
            'cart.lines.*.price' => ['required', 'integer', 'min:0'],
            'cart.lines.*.cost' => ['required', 'integer', 'min:0'],
            'cart.lines.*.discount' => ['required', 'integer', 'min:0'],
            'cart.lines.*.line_total' => ['nullable', 'integer', 'min:0'],
            'tender.type' => ['required', 'in:cash,credit,split'],
            'tender.amount_received' => ['nullable', 'integer', 'min:0'],
            'tender.cash_amount' => ['nullable', 'integer', 'min:0'],
            'tender.credit_amount' => ['nullable', 'integer', 'min:0'],
            'tender.amount' => ['nullable', 'integer', 'min:0'],
        ]);

        $local = $this->localDatabase->requireReady();
        $quantities = [];
        foreach ($validated['cart']['lines'] as $line) {
            if (!$local->table('products')->where('id', $line['product_id'])->where('is_active', true)->exists()) {
                throw ValidationException::withMessages(['cart.lines' => 'A product is not available in this terminal catalog. Sync the catalog and retry.']);
            }
            $quantities[$line['product_id']] = ($quantities[$line['product_id']] ?? 0) + $line['quantity'];
        }

        $id = (string) Str::uuid();
        $createdAt = now();
        $tender = $validated['tender'];
        $cashAmount = $tender['type'] === 'cash'
            ? (int) ($tender['amount_received'] ?? 0) - max(0, (int) ($tender['amount_received'] ?? 0) - $validated['cart']['grand_total'])
            : (int) ($tender['cash_amount'] ?? 0);
        $creditAmount = $tender['type'] === 'credit'
            ? (int) ($tender['amount'] ?? $validated['cart']['grand_total'])
            : (int) ($tender['credit_amount'] ?? 0);
        $change = max(0, (int) ($tender['amount_received'] ?? 0) - $validated['cart']['grand_total']);
        if ($tender['type'] === 'cash' && (int) ($tender['amount_received'] ?? 0) < $validated['cart']['grand_total']) {
            throw ValidationException::withMessages(['tender.amount_received' => 'Cash received is less than the sale total.']);
        }
        if ($cashAmount + $creditAmount !== $validated['cart']['grand_total']) {
            throw ValidationException::withMessages(['tender' => 'Payment amounts must equal the sale total.']);
        }

        $batchDeductions = [];
        $movements = [];
        foreach ($quantities as $productId => $quantity) {
            $batches = $local->table('grocery_batches')
                ->where('product_id', $productId)
                ->where('remaining_quantity', '>', 0)
                ->whereDate('expiration_date', '>=', today())
                ->orderBy('expiration_date')
                ->orderBy('id')
                ->get(['id', 'remaining_quantity']);
            $available = (int) $batches->sum('remaining_quantity');
            if ($available < $quantity) {
                throw ValidationException::withMessages(['cart.lines' => 'Insufficient unexpired stock in this terminal for one or more products.']);
            }

            $remaining = $quantity;
            foreach ($batches as $batch) {
                if ($remaining === 0) break;
                $deduct = min($remaining, (int) $batch->remaining_quantity);
                $batchDeductions[] = ['batch_id' => $batch->id, 'quantity' => $deduct];
                $remaining -= $deduct;
            }

            $movements[] = [
                'id' => (string) Str::uuid(),
                'product_id' => $productId,
                'quantity' => $quantity,
                'type' => 'OUT',
                'reason' => 'POS sale ' . $validated['client_uuid'],
                'created_at' => $createdAt,
            ];
        }

        $sale = [
            'id' => $id,
            'client_uuid' => $validated['client_uuid'],
            'shareholder_id' => $validated['shareholder_id'] ?? $tender['shareholder_id'] ?? $tender['credit_shareholder_id'] ?? null,
            'cashier_id' => $validated['cashier_id'] ?? null,
            'terminal_id' => $validated['terminal_id'],
            'subtotal' => $validated['cart']['subtotal'] / 100,
            'discount_total' => $validated['cart']['discount_total'] / 100,
            'tax_total' => $validated['cart']['tax_total'] / 100,
            'total_amount' => $validated['cart']['grand_total'] / 100,
            'tender_type' => $tender['type'],
            'cash_amount' => $cashAmount / 100,
            'credit_amount' => $creditAmount / 100,
            'change_due' => $change / 100,
            'status' => 'completed',
            'created_at' => $createdAt,
        ];

        $items = [];
        foreach ($validated['cart']['lines'] as $line) {
            $product = $local->table('products')->where('id', $line['product_id'])->first();
            $items[] = [
                'id' => (string) Str::uuid(),
                'sale_id' => $id,
                'product_id' => $line['product_id'],
                'product_code' => $line['product_code'] ?? $product->barcode ?? $product->id,
                'product_name' => $line['product_name'] ?? $product->product_name,
                'unit' => $line['unit'] ?? 'unit',
                'quantity' => $line['quantity'],
                'selling_price' => $line['price'] / 100,
                'unit_cost' => $line['cost'] / 100,
                'discount' => $line['discount'] / 100,
                'line_total' => max(0, ($line['price'] - $line['discount']) * $line['quantity']) / 100,
                'created_at' => $createdAt,
            ];
        }

        $creditTransaction = null;
        $shareholderId = $sale['shareholder_id'];
        if ($creditAmount > 0 && $shareholderId) {
            $creditTransaction = [
                'reference_id' => $validated['client_uuid'],
                'shareholder_id' => $shareholderId,
                'type' => 'POS_CREDIT',
                'method' => 'Credit',
                'amount' => $creditAmount / 100,
                'status' => 'Successful',
                'date' => $createdAt,
            ];
        }

        $result = $this->syncService->recordSale($sale, $items, $creditTransaction, $batchDeductions, $movements);

        return response()->json(['success' => true, 'data' => $result], 201);
    }

    public function sync(): JsonResponse
    {
        try {
            $result = $this->syncService->sync();
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Throwable $error) {
            return response()->json([
                'success' => false,
                'message' => 'Sale is saved locally; central sync is unavailable.',
                'data' => ['pending_sales' => $this->syncService->pendingCount()],
            ]);
        }
    }

    public function status(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->syncService->status()]);
    }

    public function offlineLogin(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $this->localDatabase->requireReady();
        $user = User::where('email', $credentials['email'])->first();
        if (!$user
            || $user->status !== 'active'
            || !in_array($user->role, ['clerk', 'manager', 'staff', 'admin'], true)
            || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials or no active offline account.'], 401);
        }

        $issuedToken = $user->createToken('pos-offline', ['*'], now()->addHours(12));

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'accessToken' => $issuedToken->plainTextToken,
                'refreshToken' => $issuedToken->plainTextToken,
                'expiresIn' => 43200,
            ],
        ]);
    }
}
