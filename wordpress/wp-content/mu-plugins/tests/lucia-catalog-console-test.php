<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);

$GLOBALS['lucia_catalog_console_allowed_capabilities'] = [];

function current_user_can(string $capability): bool
{
    return in_array($capability, $GLOBALS['lucia_catalog_console_allowed_capabilities'], true);
}

require __DIR__ . '/../lucia-catalog-console.php';

function assertSameValue(mixed $expected, mixed $actual, string $message): void
{
    if ($expected === $actual) {
        return;
    }

    fwrite(STDERR, $message . PHP_EOL);
    fwrite(STDERR, 'Expected: ' . var_export($expected, true) . PHP_EOL);
    fwrite(STDERR, 'Actual: ' . var_export($actual, true) . PHP_EOL);
    exit(1);
}

$config = [
    'default_active_sheet_id' => '102593401',
    'default_artist_name' => 'Lucía Astuy',
    'default_drive_folder_id' => 'folder-123',
    'default_profile' => 'nacho-saski',
];

$payload = lucia_catalog_console_build_queue_payload(
    [
        'active_sheet_id' => '102593401',
        'artist_name' => '',
        'catalog_title' => '  May Catalog <b>Draft</b>  ',
        'created_by_email' => ' operator@example.com ',
        'created_by_user_key' => ' operator ',
        'execution_profile_key' => '',
        'output_folder_id' => '',
        'scope_mode' => ' selected_tabs ',
        'selected_sheet_ids' => ['102593401', 'bad', '7'],
    ],
    $config,
);

$defaultPayload = lucia_catalog_console_build_queue_payload(
    [
        'catalog_title' => 'Default Year',
    ],
    $config,
);

assertSameValue(
    102593401,
    $defaultPayload['activeSheetId'],
    'Default active sheet id should be used when the WordPress request does not include one.',
);

assertSameValue(
    [
        'activeSheetId' => 102593401,
        'artistName' => 'Lucía Astuy',
        'catalogTitle' => 'May Catalog Draft',
        'createdByEmail' => 'operator@example.com',
        'createdByUserKey' => 'operator',
        'executionProfileKey' => 'nacho-saski',
        'outputFolderId' => 'folder-123',
        'scopeMode' => 'selected_tabs',
        'selectedSheetIds' => [102593401, 7],
    ],
    $payload,
    'Queue payload should be sanitized and use configured profile/folder defaults.',
);

$GLOBALS['lucia_catalog_console_allowed_capabilities'] = ['edit_posts'];
assertSameValue(false, lucia_catalog_console_user_can_manage(), 'Editors should not manage catalog PDFs by default.');

$GLOBALS['lucia_catalog_console_allowed_capabilities'] = ['manage_woocommerce'];
assertSameValue(true, lucia_catalog_console_user_can_manage(), 'Shop operators should manage catalog PDFs.');
