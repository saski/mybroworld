<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function lucia_catalog_console_config_value(string $constantName, string $environmentName, string $fallback = ''): string
{
    if (defined($constantName)) {
        return trim((string) constant($constantName));
    }

    $environmentValue = getenv($environmentName);
    if ($environmentValue !== false) {
        return trim((string) $environmentValue);
    }

    return $fallback;
}

function lucia_catalog_console_config(): array
{
    return [
        'api_token' => lucia_catalog_console_config_value('LUCIA_CATALOG_API_TOKEN', 'LUCIA_CATALOG_API_TOKEN'),
        'api_url' => lucia_catalog_console_config_value('LUCIA_CATALOG_API_URL', 'LUCIA_CATALOG_API_URL'),
        'capability' => lucia_catalog_console_config_value(
            'LUCIA_CATALOG_CONSOLE_CAPABILITY',
            'LUCIA_CATALOG_CONSOLE_CAPABILITY',
            'manage_woocommerce',
        ),
        'default_active_sheet_id' => lucia_catalog_console_config_value(
            'LUCIA_CATALOG_DEFAULT_ACTIVE_SHEET_ID',
            'LUCIA_CATALOG_DEFAULT_ACTIVE_SHEET_ID',
        ),
        'default_artist_name' => lucia_catalog_console_config_value(
            'LUCIA_CATALOG_DEFAULT_ARTIST_NAME',
            'LUCIA_CATALOG_DEFAULT_ARTIST_NAME',
            'Lucía Astuy',
        ),
        'default_drive_folder_id' => lucia_catalog_console_config_value(
            'LUCIA_CATALOG_DEFAULT_DRIVE_FOLDER_ID',
            'LUCIA_CATALOG_DEFAULT_DRIVE_FOLDER_ID',
        ),
        'default_profile' => lucia_catalog_console_config_value(
            'LUCIA_CATALOG_DEFAULT_PROFILE',
            'LUCIA_CATALOG_DEFAULT_PROFILE',
        ),
        'default_scope_mode' => lucia_catalog_console_config_value(
            'LUCIA_CATALOG_DEFAULT_SCOPE_MODE',
            'LUCIA_CATALOG_DEFAULT_SCOPE_MODE',
            'current_tab',
        ),
    ];
}

function lucia_catalog_console_is_configured(?array $config = null): bool
{
    $resolvedConfig = $config ?? lucia_catalog_console_config();

    return ($resolvedConfig['api_url'] ?? '') !== ''
        && ($resolvedConfig['api_token'] ?? '') !== ''
        && ($resolvedConfig['default_drive_folder_id'] ?? '') !== ''
        && ($resolvedConfig['default_profile'] ?? '') !== '';
}

function lucia_catalog_console_sanitize_text(mixed $value): string
{
    if (is_array($value) || is_object($value)) {
        return '';
    }

    if (function_exists('wp_unslash')) {
        $value = wp_unslash($value);
    }

    if (function_exists('sanitize_text_field')) {
        return sanitize_text_field((string) $value);
    }

    $withoutTags = strip_tags((string) $value);
    $normalizedWhitespace = preg_replace('/\s+/', ' ', $withoutTags) ?: '';

    return trim($normalizedWhitespace);
}

function lucia_catalog_console_sanitize_email(mixed $value): string
{
    $email = lucia_catalog_console_sanitize_text($value);

    if (function_exists('sanitize_email')) {
        return sanitize_email($email);
    }

    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
}

function lucia_catalog_console_positive_int(mixed $value): int
{
    if (function_exists('wp_unslash')) {
        $value = wp_unslash($value);
    }

    $integerValue = filter_var($value, FILTER_VALIDATE_INT);

    return is_int($integerValue) && $integerValue > 0 ? $integerValue : 0;
}

function lucia_catalog_console_selected_sheet_ids(mixed $value): array
{
    if (is_string($value)) {
        $value = explode(',', $value);
    }

    if (! is_array($value)) {
        return [];
    }

    $ids = [];
    foreach ($value as $candidate) {
        $sheetId = lucia_catalog_console_positive_int($candidate);
        if ($sheetId > 0) {
            $ids[] = $sheetId;
        }
    }

    return array_values(array_unique($ids));
}

function lucia_catalog_console_scope_mode(mixed $value, array $config): string
{
    $allowedScopeModes = ['current_tab', 'selected_tabs', 'all_compatible_tabs'];
    $scopeMode = strtolower(str_replace('-', '_', lucia_catalog_console_sanitize_text($value)));

    if (in_array($scopeMode, $allowedScopeModes, true)) {
        return $scopeMode;
    }

    $defaultScopeMode = strtolower(str_replace(
        '-',
        '_',
        lucia_catalog_console_sanitize_text($config['default_scope_mode'] ?? 'current_tab'),
    ));

    return in_array($defaultScopeMode, $allowedScopeModes, true) ? $defaultScopeMode : 'current_tab';
}

function lucia_catalog_console_build_queue_payload(array $input, array $config): array
{
    $executionProfileKey = lucia_catalog_console_sanitize_text($input['execution_profile_key'] ?? '');
    if ($executionProfileKey === '') {
        $executionProfileKey = lucia_catalog_console_sanitize_text($config['default_profile'] ?? '');
    }

    $outputFolderId = lucia_catalog_console_sanitize_text($input['output_folder_id'] ?? '');
    if ($outputFolderId === '') {
        $outputFolderId = lucia_catalog_console_sanitize_text($config['default_drive_folder_id'] ?? '');
    }

    $artistName = lucia_catalog_console_sanitize_text($input['artist_name'] ?? '');
    if ($artistName === '') {
        $artistName = lucia_catalog_console_sanitize_text($config['default_artist_name'] ?? 'Lucía Astuy');
    }

    return [
        'activeSheetId' => lucia_catalog_console_positive_int(
            $input['active_sheet_id'] ?? ($config['default_active_sheet_id'] ?? 0),
        ),
        'artistName' => $artistName,
        'catalogTitle' => lucia_catalog_console_sanitize_text($input['catalog_title'] ?? ''),
        'createdByEmail' => lucia_catalog_console_sanitize_email($input['created_by_email'] ?? ''),
        'createdByUserKey' => lucia_catalog_console_sanitize_text($input['created_by_user_key'] ?? ''),
        'executionProfileKey' => $executionProfileKey,
        'outputFolderId' => $outputFolderId,
        'scopeMode' => lucia_catalog_console_scope_mode($input['scope_mode'] ?? '', $config),
        'selectedSheetIds' => lucia_catalog_console_selected_sheet_ids($input['selected_sheet_ids'] ?? []),
    ];
}

function lucia_catalog_console_build_review_payload(array $input, array $currentUser): array
{
    $reviewStatus = strtolower(str_replace('-', '_', lucia_catalog_console_sanitize_text($input['review_status'] ?? '')));
    if (! in_array($reviewStatus, ['approved', 'needs_changes'], true)) {
        $reviewStatus = '';
    }

    $reviewedBy = lucia_catalog_console_sanitize_text($currentUser['display_name'] ?? '');
    if ($reviewedBy === '') {
        $reviewedBy = lucia_catalog_console_sanitize_email($currentUser['user_email'] ?? '');
    }

    return [
        'jobId' => lucia_catalog_console_sanitize_text($input['job_id'] ?? ''),
        'reviewNotes' => lucia_catalog_console_sanitize_text($input['review_notes'] ?? ''),
        'reviewStatus' => $reviewStatus,
        'reviewedBy' => $reviewedBy,
    ];
}

function lucia_catalog_console_user_can_manage(?array $config = null): bool
{
    $resolvedConfig = $config ?? lucia_catalog_console_config();
    $capability = lucia_catalog_console_sanitize_text($resolvedConfig['capability'] ?? 'manage_woocommerce');

    return function_exists('current_user_can') && current_user_can($capability);
}

function lucia_catalog_console_current_user_payload(): array
{
    if (! function_exists('wp_get_current_user')) {
        return [
            'display_name' => '',
            'user_email' => '',
            'user_login' => '',
        ];
    }

    $user = wp_get_current_user();

    return [
        'display_name' => (string) ($user->display_name ?? ''),
        'user_email' => (string) ($user->user_email ?? ''),
        'user_login' => (string) ($user->user_login ?? ''),
    ];
}

function lucia_catalog_console_call_api(string $action, array $data, ?array $config = null): mixed
{
    $resolvedConfig = $config ?? lucia_catalog_console_config();
    if (! lucia_catalog_console_is_configured($resolvedConfig)) {
        throw new RuntimeException('Catalog API endpoint, token, default profile, and default Drive folder must be configured.');
    }

    if (! function_exists('wp_remote_post')) {
        throw new RuntimeException('WordPress HTTP API is not available.');
    }

    $body = [
        'action' => $action,
        'data' => $data,
        'token' => $resolvedConfig['api_token'],
    ];
    $response = wp_remote_post($resolvedConfig['api_url'], [
        'body' => function_exists('wp_json_encode') ? wp_json_encode($body) : json_encode($body),
        'headers' => [
            'Content-Type' => 'application/json',
        ],
        'timeout' => 30,
    ]);

    if (function_exists('is_wp_error') && is_wp_error($response)) {
        throw new RuntimeException($response->get_error_message());
    }

    $responseCode = function_exists('wp_remote_retrieve_response_code')
        ? (int) wp_remote_retrieve_response_code($response)
        : (int) ($response['response']['code'] ?? 0);
    $responseBody = function_exists('wp_remote_retrieve_body')
        ? (string) wp_remote_retrieve_body($response)
        : (string) ($response['body'] ?? '');

    if ($responseCode < 200 || $responseCode >= 300) {
        throw new RuntimeException('Catalog API request failed with HTTP ' . $responseCode . '.');
    }

    $payload = json_decode($responseBody, true);
    if (! is_array($payload)) {
        throw new RuntimeException('Catalog API returned invalid JSON.');
    }

    if (($payload['ok'] ?? false) !== true) {
        $message = is_array($payload['error'] ?? null)
            ? lucia_catalog_console_sanitize_text($payload['error']['message'] ?? '')
            : '';
        throw new RuntimeException($message !== '' ? $message : 'Catalog API request failed.');
    }

    return $payload['result'] ?? null;
}

function lucia_catalog_console_send_success(mixed $data): void
{
    if (function_exists('wp_send_json_success')) {
        wp_send_json_success($data);
    }

    echo json_encode(['data' => $data, 'success' => true]);
}

function lucia_catalog_console_send_error(string $message, int $statusCode = 400): void
{
    if (function_exists('wp_send_json_error')) {
        wp_send_json_error(['message' => $message], $statusCode);
    }

    http_response_code($statusCode);
    echo json_encode(['data' => ['message' => $message], 'success' => false]);
}

function lucia_catalog_console_verify_ajax_request(array $config): bool
{
    if (! lucia_catalog_console_user_can_manage($config)) {
        lucia_catalog_console_send_error('You are not allowed to manage catalog PDFs.', 403);
        return false;
    }

    if (function_exists('check_ajax_referer') && check_ajax_referer('lucia_catalog_console', 'nonce', false) === false) {
        lucia_catalog_console_send_error('Invalid catalog console nonce.', 403);
        return false;
    }

    return true;
}

function lucia_catalog_console_handle_queue(): void
{
    $config = lucia_catalog_console_config();
    if (! lucia_catalog_console_verify_ajax_request($config)) {
        return;
    }

    $input = $_POST;
    $currentUser = lucia_catalog_console_current_user_payload();
    $input['created_by_email'] = $input['created_by_email'] ?? $currentUser['user_email'];
    $input['created_by_user_key'] = $input['created_by_user_key'] ?? $currentUser['user_login'];

    try {
        lucia_catalog_console_send_success(lucia_catalog_console_call_api(
            'queue_catalog_job',
            lucia_catalog_console_build_queue_payload($input, $config),
            $config,
        ));
    } catch (Throwable $error) {
        lucia_catalog_console_send_error($error->getMessage());
    }
}

function lucia_catalog_console_handle_get_job(): void
{
    $config = lucia_catalog_console_config();
    if (! lucia_catalog_console_verify_ajax_request($config)) {
        return;
    }

    $jobId = lucia_catalog_console_sanitize_text($_POST['job_id'] ?? '');
    if ($jobId === '') {
        lucia_catalog_console_send_error('Provide job_id.');
        return;
    }

    try {
        lucia_catalog_console_send_success(lucia_catalog_console_call_api('get_catalog_job', [
            'jobId' => $jobId,
        ], $config));
    } catch (Throwable $error) {
        lucia_catalog_console_send_error($error->getMessage());
    }
}

function lucia_catalog_console_handle_recent_jobs(): void
{
    $config = lucia_catalog_console_config();
    if (! lucia_catalog_console_verify_ajax_request($config)) {
        return;
    }

    $limit = lucia_catalog_console_positive_int($_POST['limit'] ?? 10);

    try {
        lucia_catalog_console_send_success(lucia_catalog_console_call_api('list_recent_catalog_jobs', [
            'limit' => max(1, min($limit > 0 ? $limit : 10, 50)),
        ], $config));
    } catch (Throwable $error) {
        lucia_catalog_console_send_error($error->getMessage());
    }
}

function lucia_catalog_console_handle_review(): void
{
    $config = lucia_catalog_console_config();
    if (! lucia_catalog_console_verify_ajax_request($config)) {
        return;
    }

    $payload = lucia_catalog_console_build_review_payload($_POST, lucia_catalog_console_current_user_payload());
    if ($payload['jobId'] === '' || $payload['reviewStatus'] === '') {
        lucia_catalog_console_send_error('Provide job_id and a valid review_status.');
        return;
    }

    try {
        lucia_catalog_console_send_success(lucia_catalog_console_call_api('record_catalog_review', $payload, $config));
    } catch (Throwable $error) {
        lucia_catalog_console_send_error($error->getMessage());
    }
}

function lucia_catalog_console_register_admin_page(): void
{
    if (! function_exists('add_menu_page')) {
        return;
    }

    $config = lucia_catalog_console_config();
    add_menu_page(
        'Catalog PDFs',
        'Catalog PDFs',
        $config['capability'],
        'lucia-catalog-console',
        'lucia_catalog_console_render_admin_page',
        'dashicons-media-document',
        56,
    );
}

function lucia_catalog_console_render_admin_page(): void
{
    $config = lucia_catalog_console_config();
    $nonce = function_exists('wp_create_nonce') ? wp_create_nonce('lucia_catalog_console') : '';
    $ajaxUrl = function_exists('admin_url') ? admin_url('admin-ajax.php') : '';

    echo '<div class="wrap" id="lucia-catalog-console" data-ajax-url="' . esc_attr($ajaxUrl) . '" data-nonce="' . esc_attr($nonce) . '">';
    echo '<h1>Catalog PDFs</h1>';

    if (! lucia_catalog_console_is_configured($config)) {
        echo '<div class="notice notice-warning"><p>Catalog API configuration is required.</p></div>';
    }

    echo '</div>';
}

function lucia_catalog_console_register_hooks(): void
{
    if (! function_exists('add_action')) {
        return;
    }

    add_action('admin_menu', 'lucia_catalog_console_register_admin_page');
    add_action('wp_ajax_lucia_catalog_console_queue', 'lucia_catalog_console_handle_queue');
    add_action('wp_ajax_lucia_catalog_console_get_job', 'lucia_catalog_console_handle_get_job');
    add_action('wp_ajax_lucia_catalog_console_recent_jobs', 'lucia_catalog_console_handle_recent_jobs');
    add_action('wp_ajax_lucia_catalog_console_review', 'lucia_catalog_console_handle_review');
}

lucia_catalog_console_register_hooks();
