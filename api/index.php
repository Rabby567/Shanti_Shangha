<?php
/**
 * API entry point / health check.
 *
 * This endpoint is intentionally small for the first backend milestone.
 * CRUD endpoints will be added module-by-module after the database and
 * authentication foundation is in place.
 */

require_once __DIR__ . '/helpers.php';
allow_cors();

try {
    require_once __DIR__ . '/db.php';
    db()->query('SELECT 1');

    send_json([
        'success' => true,
        'service' => 'Shanti Sangha API',
        'status' => 'ok',
    ]);
} catch (Throwable $error) {
    // Never expose database credentials or internal exception details.
    send_json([
        'success' => false,
        'service' => 'Shanti Sangha API',
        'status' => 'configuration_required',
    ], 503);
}
