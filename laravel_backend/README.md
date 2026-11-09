# Laravel Backend

This is the Laravel backend for the Lending PIS project.

## Setup

1. Install dependencies:
   ```bash
   composer install
   ```

2. Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   ```

3. Generate application key:
   ```bash
   php artisan key:generate
   ```

4. Run migrations:
   ```bash
   php artisan migrate
   ```

5. Start the development server:
   ```bash
   php artisan serve
   ```

## Project Structure

- `app/` - Application core code (Models, Controllers, Services, etc.)
- `config/` - Configuration files
- `database/` - Migrations, seeders, factories
- `routes/` - Route definitions
- `resources/` - Views, language files
- `tests/` - Test files

## API Documentation

See [README_API.md](README_API.md) for API documentation.

## Local-First POS

Each checkout terminal must run its own Laravel POS API process. The `sqlite`
connection stores that terminal's catalog cache, sales, credit transactions,
inventory deductions, and pending sync outbox. The `mysql` connection remains
the central source of truth. Do not point multiple terminals at the same SQLite
file.

Configure each terminal's local `.env` with an absolute, persistent SQLite path:

```dotenv
SQLITE_DATABASE="C:/path/to/terminal-data/offline.sqlite"
```

The central `mysql` connection must point to an existing MySQL database. Set
`DB_USERNAME` and `DB_PASSWORD` to credentials created for that MySQL instance;
the previous PostgreSQL credentials are not valid MySQL credentials.

Create/migrate the local database, and apply the new POS migration to MySQL
after confirming the central database connection is correct:

```powershell
php artisan migrate --database=sqlite --force
php artisan migrate --database=mysql --force
```

The React app must call that terminal's local API (`VITE_API_BASE_URL`, or the
Vite `/api` proxy during local development). After a cashier signs in online,
the token is cached in that terminal's SQLite database. POS checkout then writes
only to SQLite; `POST /api/pos/sync` pushes pending sales and pulls products,
shareholders, and stock batches. The POS background worker retries sync every
30 seconds and also syncs when the browser returns online.

The current shareholder schema does not define credit limits. Credit sales are
recorded locally, but offline limit enforcement requires a configured credit
limit source before enabling credit tenders for production.