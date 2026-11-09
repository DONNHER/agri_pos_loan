#!/bin/sh
set -e

echo "--- Deployment Starting ---"

# 1. Fix Permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 2. Clear bootstrap cache files
rm -f bootstrap/cache/*.php

# 3. Create storage link
php artisan storage:link --force || echo "Storage link already exists."

# 4. Run Migrations
echo "Running migrations..."
php artisan migrate --force

# 5. Optimization
php artisan config:cache
php artisan view:cache
php artisan route:cache || echo "Route caching failed, skipping..."

# 6. Optimized for Nginx + PHP-FPM
echo "Deployment tasks completed. Nginx and PHP-FPM will handle requests."
# exec php artisan serve --host=0.0.0.0 --port=$PORT # REMOVED for Nginx/FPM setup

