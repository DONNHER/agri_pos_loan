<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with rubric-compliant test accounts.
     */
    public function run(): void
    {
        // 1. ADMIN ACCOUNT
        User::updateOrCreate(
            ['email' => 'admin@coop.com'],
            [
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'firstname' => 'System',
                'lastname' => 'Administrator',
                'role' => User::ROLE_ADMIN,
                'status' => User::STATUS_ACTIVE,
                'mfa_enabled' => true,
            ]
        );

        // 2. STAFF ACCOUNT
        User::updateOrCreate(
            ['email' => 'staff@coop.com'],
            [
                'username' => 'staff',
                'password' => Hash::make('staff123'),
                'firstname' => 'Inventory',
                'lastname' => 'Officer',
                'role' => User::ROLE_STAFF,
                'status' => User::STATUS_ACTIVE,
                'mfa_enabled' => false, // Easier for demo purposes
            ]
        );

        // 3. MANAGER ACCOUNT
        User::updateOrCreate(
            ['email' => 'manager@coop.com'],
            [
                'username' => 'manager',
                'password' => Hash::make('manager123'),
                'firstname' => 'Branch',
                'lastname' => 'Manager',
                'role' => User::ROLE_MANAGER,
                'status' => User::STATUS_ACTIVE,
                'mfa_enabled' => false,
            ]
        );

        // 4. SHAREHOLDER ACCOUNT
        User::updateOrCreate(
            ['email' => 'member@coop.com'],
            [
                'username' => 'member',
                'password' => Hash::make('member123'),
                'firstname' => 'Shareholder',
                'lastname' => 'Member',
                'role' => User::ROLE_MEMBER,
                'status' => User::STATUS_ACTIVE,
                'mfa_enabled' => false,
            ]
        );
    }
}
