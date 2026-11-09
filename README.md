# agri_pos_loan

Lending PIS includes a Laravel API backend and two Vite frontend applications: the Loan portal and AgriTrade POS.

## Project Layout

```text
laravel_backend/  Laravel API, migrations, and seeders
react_frontend/   Loan and POS React applications
neon.ts           Neon services and bucket configuration
```

## Requirements

- PHP 8.2+ and Composer
- Node.js compatible with Vite 8 and pnpm 9+
- Neon CLI access for pulling the configured database and object-storage environment variables

## Run Locally

### Laravel API

In one terminal:

```powershell
cd laravel_backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

For the configured Neon project, run this from the repository root after signing in to Neon:

```powershell
neon env pull --file laravel_backend/.env
```

Then start the API:

```powershell
cd laravel_backend
php artisan serve
```

The API is available at `http://localhost:8000/api` by default. To create or update the database schema, run `php artisan migrate`; to add the demo accounts, run `php artisan db:seed`.

### React Frontends

In `react_frontend`, install dependencies:

```powershell
cd react_frontend
pnpm install
```

The Loan portal uses `index.html` and `frontend/loan/main.tsx`. Start it with `pnpm run dev`; open [http://localhost:3001/login](http://localhost:3001/login).

The POS uses `pos.html` and `frontend/pos/main.tsx`. Start it in a separate terminal with `pnpm run dev:pos`; open [http://localhost:3002/pos.html](http://localhost:3002/pos.html).

Both frontends use `http://localhost:8000/api` by default. Set `VITE_API_URL` in a local `react_frontend/.env.local` file to use a different API URL.

## Production Builds

Run these commands from `react_frontend`:

```powershell
pnpm run build       # Build both apps
pnpm run build:loan  # Build the Loan portal to dist/loan/
pnpm run build:pos   # Build the POS to dist/pos/
```

See [react_frontend/README.md](react_frontend/README.md) for frontend-specific setup details and [laravel_backend/README.md](laravel_backend/README.md) for backend details.
