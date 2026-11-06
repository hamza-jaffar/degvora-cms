<?php

$publicPath = __DIR__.DIRECTORY_SEPARATOR.'public';

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? ''
);

$filePath = $publicPath.str_replace('/', DIRECTORY_SEPARATOR, $uri);

// Only let PHP's built-in web server serve the request directly if it is an existing FILE.
// If it is a directory (such as /storage or /storage/) or a route, pass it through to Laravel.
if ($uri !== '/' && is_file($filePath)) {
    return false;
}

require_once $publicPath.DIRECTORY_SEPARATOR.'index.php';
