<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);
define('LUCIA_CATALOG_API_TOKEN', 'test-token-secret');
define('LUCIA_CATALOG_API_URL', 'https://script.google.test/exec');
define('LUCIA_CATALOG_DEFAULT_PROFILE', 'nacho-saski');
define('LUCIA_CATALOG_DEFAULT_DRIVE_FOLDER_ID', 'folder-123');
define('LUCIA_CATALOG_DEFAULT_ACTIVE_SHEET_ID', '102593401');

$GLOBALS['lucia_catalog_console_allowed_capabilities'] = [];
$GLOBALS['lucia_catalog_console_http_calls'] = [];

function admin_url(string $path = ''): string
{
    return 'http://localhost/wp-admin/' . ltrim($path, '/');
}

function current_user_can(string $capability): bool
{
    return in_array($capability, $GLOBALS['lucia_catalog_console_allowed_capabilities'], true);
}

function esc_attr(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function esc_html(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function wp_create_nonce(string $action): string
{
    return 'nonce-' . $action;
}

function wp_json_encode(mixed $data, int $options = 0): string
{
    return json_encode($data, $options) ?: '';
}

function wp_remote_post(string $url, array $args): array
{
    $GLOBALS['lucia_catalog_console_http_calls'][] = [
        'method' => 'POST',
        'url' => $url,
        'args' => $args,
    ];

    return [
        'body' => '<HTML><BODY>Moved Temporarily</BODY></HTML>',
        'headers' => [
            'location' => 'https://script.googleusercontent.com/macros/echo?result=ok',
        ],
        'response' => [
            'code' => 302,
        ],
    ];
}

function wp_remote_get(string $url, array $args): array
{
    $GLOBALS['lucia_catalog_console_http_calls'][] = [
        'method' => 'GET',
        'url' => $url,
        'args' => $args,
    ];

    return [
        'body' => json_encode([
            'ok' => true,
            'result' => [
                'job_id' => 'catalog_test_redirect',
            ],
        ]),
        'headers' => [],
        'response' => [
            'code' => 200,
        ],
    ];
}

function is_wp_error(mixed $response): bool
{
    return false;
}

function wp_remote_retrieve_response_code(array $response): int
{
    return (int) ($response['response']['code'] ?? 0);
}

function wp_remote_retrieve_body(array $response): string
{
    return (string) ($response['body'] ?? '');
}

function wp_remote_retrieve_header(array $response, string $header): string
{
    return (string) ($response['headers'][strtolower($header)] ?? $response['headers'][$header] ?? '');
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

ob_start();
lucia_catalog_console_render_admin_page();
$html = ob_get_clean();

assertSameValue(
    true,
    str_contains($html, 'id="lucia-catalog-console"'),
    'Admin page should render the console root.',
);
assertSameValue(
    true,
    str_contains($html, 'name="catalog_title"'),
    'Admin page should include the catalog title input.',
);
assertSameValue(
    true,
    str_contains($html, 'Generate PDF'),
    'Admin page should expose the primary generation action.',
);
assertSameValue(
    true,
    str_contains($html, 'lucia-catalog-jobs'),
    'Admin page should include the recent jobs area.',
);
assertSameValue(
    true,
    str_contains($html, 'Needs changes'),
    'Admin page should include the review action labels.',
);
assertSameValue(
    false,
    str_contains($html, 'test-token-secret'),
    'Admin page must not expose the Apps Script API token.',
);

$GLOBALS['lucia_catalog_console_http_calls'] = [];
$apiResult = lucia_catalog_console_call_api('list_recent_catalog_jobs', [
    'limit' => 1,
]);

assertSameValue(
    [
        'job_id' => 'catalog_test_redirect',
    ],
    $apiResult,
    'Catalog API calls should follow the Apps Script result redirect.',
);
assertSameValue(
    ['POST', 'GET'],
    array_column($GLOBALS['lucia_catalog_console_http_calls'], 'method'),
    'Apps Script API calls should post first and follow the redirect with a GET.',
);
