<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function lucia_artwork_meta_keys(): array
{
    return [
        'location_clean' => '_lucia_current_location',
        'location_history' => '_lucia_location_history',
        'submission_history' => '_lucia_submission_history',
    ];
}

function lucia_sanitize_artwork_text_meta(?string $value): string
{
    return trim((string) $value);
}

function lucia_sanitize_artwork_history_meta(?string $value): string
{
    $text = lucia_sanitize_artwork_text_meta($value);
    if ($text === '') {
        return '';
    }

    $parts = preg_split('/\s*->\s*/', $text) ?: [];
    $parts = array_values(array_filter(
        array_map('lucia_sanitize_artwork_text_meta', $parts),
        static fn (string $part): bool => $part !== '',
    ));

    return implode(' -> ', $parts);
}

function lucia_current_location_from_history(?string $locationHistory): string
{
    $normalizedHistory = lucia_sanitize_artwork_history_meta($locationHistory);
    if ($normalizedHistory === '') {
        return '';
    }

    $parts = explode(' -> ', $normalizedHistory);

    return end($parts) ?: '';
}

function lucia_update_artwork_location_meta(int $postId, ?string $currentLocation, ?string $locationHistory): void
{
    if (! function_exists('update_post_meta')) {
        return;
    }

    $metaKeys = lucia_artwork_meta_keys();
    $normalizedHistory = lucia_sanitize_artwork_history_meta($locationHistory);
    $normalizedCurrentLocation = lucia_sanitize_artwork_text_meta($currentLocation);

    if ($normalizedCurrentLocation === '' && $normalizedHistory !== '') {
        $normalizedCurrentLocation = lucia_current_location_from_history($normalizedHistory);
    }

    update_post_meta($postId, $metaKeys['location_clean'], $normalizedCurrentLocation);
    update_post_meta($postId, $metaKeys['location_history'], $normalizedHistory);
}

function lucia_update_artwork_submission_meta(int $postId, ?string $submissionHistory): void
{
    if (! function_exists('update_post_meta')) {
        return;
    }

    update_post_meta(
        $postId,
        lucia_artwork_meta_keys()['submission_history'],
        lucia_sanitize_artwork_text_meta($submissionHistory),
    );
}
