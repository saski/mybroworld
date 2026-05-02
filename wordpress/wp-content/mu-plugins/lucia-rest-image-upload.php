<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function lucia_image_extension_for_mime(string $mimeType): string
{
    return match ($mimeType) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        default => '',
    };
}

function lucia_safe_upload_basename(string $name): string
{
    $basename = pathinfo($name, PATHINFO_FILENAME);
    $basename = preg_replace('/[^A-Za-z0-9_-]+/', '-', $basename) ?: '';
    $basename = trim($basename, '-_');

    return $basename !== '' ? $basename : 'lucia-image';
}

function lucia_sideload_image_name_with_extension(array $file): array
{
    $name = (string) ($file['name'] ?? '');
    if (pathinfo($name, PATHINFO_EXTENSION) !== '') {
        return $file;
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    if ($tmpName === '' || ! is_readable($tmpName)) {
        return $file;
    }

    $mimeType = function_exists('mime_content_type') ? (string) mime_content_type($tmpName) : '';
    $extension = lucia_image_extension_for_mime($mimeType);
    if ($extension === '') {
        return $file;
    }

    $file['name'] = lucia_safe_upload_basename($name) . '.' . $extension;

    return $file;
}

if (function_exists('add_filter')) {
    add_filter('wp_handle_sideload_prefilter', 'lucia_sideload_image_name_with_extension');
}
