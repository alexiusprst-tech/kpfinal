<?php

/**
 * Laravel - A PHP Framework For Web Artisans
 * Emulate Apache's "mod_rewrite" functionality for PHP built-in server
 */

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
);

if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

require_once __DIR__ . '/public/index.php';
