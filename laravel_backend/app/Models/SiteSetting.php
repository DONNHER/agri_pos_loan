<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class SiteSetting
 * 
 * Manages dynamic application configuration stored in the database.
 * Used for system-wide flags, backup schedules, and contact info.
 * 
 * @package App\Models
 */
class SiteSetting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'group'];

    /**
     * Retrieve a setting value by its key.
     * Automatically casts the value to the specified type (int, bool, json).
     * 
     * @param string $key The configuration key.
     * @param mixed $default Fallback value if key is not found.
     * @return mixed
     */
    public static function get($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        if (!$setting) return $default;

        return match ($setting->type) {
            'integer' => (int) $setting->value,
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    /**
     * Create or update a configuration setting.
     * 
     * @param string $key Unique identifier.
     * @param mixed $value The data to store.
     * @param string $type Data type for casting (string, integer, boolean, json).
     * @param string $group Categorization (general, backup, etc.).
     * @return \Illuminate\Database\Eloquent\Model
     */
    public static function set($key, $value, $type = 'string', $group = 'general')
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => is_array($value) ? json_encode($value) : $value, 'type' => $type, 'group' => $group]
        );
    }
}
