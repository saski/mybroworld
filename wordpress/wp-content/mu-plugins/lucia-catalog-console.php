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

function lucia_catalog_console_response_code(mixed $response): int
{
    if (function_exists('wp_remote_retrieve_response_code')) {
        return (int) wp_remote_retrieve_response_code($response);
    }

    return (int) ($response['response']['code'] ?? 0);
}

function lucia_catalog_console_response_body(mixed $response): string
{
    if (function_exists('wp_remote_retrieve_body')) {
        return (string) wp_remote_retrieve_body($response);
    }

    return (string) ($response['body'] ?? '');
}

function lucia_catalog_console_response_header(mixed $response, string $header): string
{
    if (function_exists('wp_remote_retrieve_header')) {
        return (string) wp_remote_retrieve_header($response, $header);
    }

    $headers = $response['headers'] ?? [];
    if (! is_array($headers)) {
        return '';
    }

    $normalizedHeader = strtolower($header);
    foreach ($headers as $name => $value) {
        if (strtolower((string) $name) === $normalizedHeader) {
            return is_array($value) ? (string) reset($value) : (string) $value;
        }
    }

    return '';
}

function lucia_catalog_console_is_allowed_api_redirect(string $location): bool
{
    $host = strtolower((string) parse_url($location, PHP_URL_HOST));

    return in_array($host, ['script.google.com', 'script.googleusercontent.com'], true);
}

function lucia_catalog_console_api_http_error_message(int $responseCode, string $responseBody): string
{
    if (in_array($responseCode, [401, 403], true)) {
        $normalizedBody = strtolower(strip_tags($responseBody));
        $looksLikeGoogleAccessDenied = str_contains($normalizedBody, 'access denied')
            || str_contains($normalizedBody, 'you need access')
            || str_contains($normalizedBody, 'acceso denegado')
            || str_contains($normalizedBody, 'necesitas acceso');

        if ($looksLikeGoogleAccessDenied) {
            return 'Catalog API Web App is not reachable from WordPress. Redeploy the Apps Script Web App with access set to Anyone and update LUCIA_CATALOG_API_URL if the deployment URL changed.';
        }
    }

    return 'Catalog API request failed with HTTP ' . $responseCode . '.';
}

function lucia_catalog_console_post_api_request(array $body, array $config): mixed
{
    $requestArgs = [
        'body' => function_exists('wp_json_encode') ? wp_json_encode($body) : json_encode($body),
        'headers' => [
            'Content-Type' => 'application/json',
        ],
        'redirection' => 0,
        'timeout' => 30,
    ];
    $response = wp_remote_post($config['api_url'], $requestArgs);

    if (function_exists('is_wp_error') && is_wp_error($response)) {
        return $response;
    }

    $responseCode = lucia_catalog_console_response_code($response);
    $location = lucia_catalog_console_response_header($response, 'location');
    if ($responseCode >= 300 && $responseCode < 400 && $location !== '' && lucia_catalog_console_is_allowed_api_redirect($location)) {
        if (! function_exists('wp_remote_get')) {
            return $response;
        }

        return wp_remote_get($location, [
            'redirection' => 0,
            'timeout' => 30,
        ]);
    }

    return $response;
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
    $response = lucia_catalog_console_post_api_request($body, $resolvedConfig);

    if (function_exists('is_wp_error') && is_wp_error($response)) {
        throw new RuntimeException($response->get_error_message());
    }

    $responseCode = lucia_catalog_console_response_code($response);
    $responseBody = lucia_catalog_console_response_body($response);

    if ($responseCode < 200 || $responseCode >= 300) {
        throw new RuntimeException(lucia_catalog_console_api_http_error_message($responseCode, $responseBody));
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

function lucia_catalog_console_timezone(): DateTimeZone
{
    if (function_exists('wp_timezone')) {
        $timezone = wp_timezone();
        if ($timezone instanceof DateTimeZone) {
            return $timezone;
        }
    }

    return new DateTimeZone(date_default_timezone_get());
}

function lucia_catalog_console_format_local_datetime(mixed $value): string
{
    $timestamp = lucia_catalog_console_sanitize_text($value);
    if ($timestamp === '') {
        return '';
    }

    try {
        $datetime = new DateTimeImmutable($timestamp);
    } catch (Throwable) {
        return $timestamp;
    }

    return $datetime
        ->setTimezone(lucia_catalog_console_timezone())
        ->format('Y-m-d H:i');
}

function lucia_catalog_console_with_local_created_at(array $job): array
{
    $job['created_at_local'] = lucia_catalog_console_format_local_datetime($job['created_at'] ?? '');

    return $job;
}

function lucia_catalog_console_jobs_with_local_created_at(mixed $jobs): mixed
{
    if (! is_array($jobs)) {
        return $jobs;
    }

    return array_map(
        fn (mixed $job): mixed => is_array($job) ? lucia_catalog_console_with_local_created_at($job) : $job,
        $jobs,
    );
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
        $job = lucia_catalog_console_call_api(
            'queue_catalog_job',
            lucia_catalog_console_build_queue_payload($input, $config),
            $config,
        );
        lucia_catalog_console_send_success(is_array($job) ? lucia_catalog_console_with_local_created_at($job) : $job);
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
        $job = lucia_catalog_console_call_api('get_catalog_job', [
            'jobId' => $jobId,
        ], $config);
        lucia_catalog_console_send_success(is_array($job) ? lucia_catalog_console_with_local_created_at($job) : $job);
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
        $jobs = lucia_catalog_console_call_api('list_recent_catalog_jobs', [
            'limit' => max(1, min($limit > 0 ? $limit : 10, 50)),
        ], $config);
        lucia_catalog_console_send_success(lucia_catalog_console_jobs_with_local_created_at($jobs));
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

function lucia_catalog_console_default_catalog_title(?int $timestamp = null): string
{
    return 'Catalog ' . gmdate('Y-m-d', $timestamp ?? time());
}

function lucia_catalog_console_json_encode(array $data): string
{
    $options = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT;
    $encoded = function_exists('wp_json_encode')
        ? wp_json_encode($data, $options)
        : json_encode($data, $options);

    return is_string($encoded) ? $encoded : '{}';
}

function lucia_catalog_console_render_admin_page(): void
{
    $config = lucia_catalog_console_config();
    $nonce = function_exists('wp_create_nonce') ? wp_create_nonce('lucia_catalog_console') : '';
    $ajaxUrl = function_exists('admin_url') ? admin_url('admin-ajax.php') : '';
    $settings = [
        'ajaxUrl' => $ajaxUrl,
        'defaultActiveSheetId' => $config['default_active_sheet_id'],
        'defaultProfile' => $config['default_profile'],
        'defaultScopeMode' => lucia_catalog_console_scope_mode('', $config),
        'nonce' => $nonce,
    ];

    echo '<div class="wrap" id="lucia-catalog-console" data-ajax-url="' . esc_attr($ajaxUrl) . '" data-nonce="' . esc_attr($nonce) . '">';
    echo '<h1>Catalog PDFs</h1>';

    if (! lucia_catalog_console_is_configured($config)) {
        echo '<div class="notice notice-warning"><p>Catalog API configuration is required.</p></div>';
    }

    echo '<form id="lucia-catalog-generate-form" class="lucia-catalog-console__form">';
    echo '<input type="hidden" name="active_sheet_id" value="' . esc_attr($config['default_active_sheet_id']) . '">';
    echo '<input type="hidden" name="execution_profile_key" value="' . esc_attr($config['default_profile']) . '">';
    echo '<table class="form-table" role="presentation"><tbody>';
    echo '<tr>';
    echo '<th scope="row"><label for="lucia-catalog-title">Catalog title</label></th>';
    echo '<td><input class="regular-text" id="lucia-catalog-title" name="catalog_title" type="text" value="' . esc_attr(lucia_catalog_console_default_catalog_title()) . '" required></td>';
    echo '</tr>';
    echo '<tr>';
    echo '<th scope="row"><label for="lucia-catalog-scope">Scope</label></th>';
    echo '<td><select id="lucia-catalog-scope" name="scope_mode">';
    foreach ([
        'current_tab' => 'Current year',
        'all_compatible_tabs' => 'All compatible years',
    ] as $scopeMode => $label) {
        $selected = $scopeMode === $settings['defaultScopeMode'] ? ' selected' : '';
        echo '<option value="' . esc_attr($scopeMode) . '"' . $selected . '>' . esc_html($label) . '</option>';
    }
    echo '</select></td>';
    echo '</tr>';
    echo '</tbody></table>';
    echo '<p class="submit"><button class="button button-primary" id="lucia-catalog-generate-button" type="submit">Generate PDF</button></p>';
    echo '</form>';

    echo '<div id="lucia-catalog-status" class="notice notice-info hidden" aria-live="polite"></div>';

    echo '<h2>Recent Jobs</h2>';
    echo '<table class="widefat striped" id="lucia-catalog-jobs">';
    echo '<thead><tr><th>Created</th><th>Title</th><th>Status</th><th>Result</th><th>Review</th><th>Actions</th></tr></thead>';
    echo '<tbody><tr><td colspan="6">Loading catalog jobs...</td></tr></tbody>';
    echo '</table>';

    echo '<script id="lucia-catalog-console-settings" type="application/json">' . lucia_catalog_console_json_encode($settings) . '</script>';
    echo '<style>
        #lucia-catalog-console .lucia-catalog-console__form {
            max-width: 760px;
        }
        #lucia-catalog-status {
            margin-top: 12px;
            padding: 10px 12px;
        }
        #lucia-catalog-jobs {
            margin-top: 8px;
            max-width: 1180px;
        }
        #lucia-catalog-jobs th,
        #lucia-catalog-jobs td {
            vertical-align: middle;
        }
        .lucia-catalog-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
    </style>';
    echo '<script>
(() => {
    const root = document.getElementById("lucia-catalog-console");
    const settingsEl = document.getElementById("lucia-catalog-console-settings");
    if (!root || !settingsEl) {
        return;
    }

    const settings = JSON.parse(settingsEl.textContent || "{}");
    const form = document.getElementById("lucia-catalog-generate-form");
    const statusBox = document.getElementById("lucia-catalog-status");
    const jobsBody = document.querySelector("#lucia-catalog-jobs tbody");
    const generateButton = document.getElementById("lucia-catalog-generate-button");
    let activeJobId = "";
    let pollTimer = null;

    function setStatus(message, type = "info") {
        statusBox.className = `notice notice-${type}`;
        statusBox.textContent = message;
    }

    function clearStatus() {
        statusBox.className = "notice notice-info hidden";
        statusBox.textContent = "";
    }

    async function postCatalogAction(action, fields = {}) {
        const body = new URLSearchParams({
            action,
            nonce: settings.nonce,
            ...fields,
        });
        const response = await fetch(settings.ajaxUrl, {
            credentials: "same-origin",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body,
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
            const message = payload?.data?.message || "Catalog request failed.";
            throw new Error(message);
        }
        return payload.data;
    }

    function statusLabel(job) {
        const status = String(job.status || "");
        const inProgress = ["queued", "claimed", "exporting", "merging", "rendering", "uploading"].includes(status);
        if (inProgress && job.heartbeat_at) {
            const heartbeatMs = Date.parse(job.heartbeat_at);
            if (Number.isFinite(heartbeatMs) && Date.now() - heartbeatMs > 15 * 60 * 1000) {
                return "Waiting for catalog worker";
            }
        }
        return status || "unknown";
    }

    function escapeText(value) {
        const span = document.createElement("span");
        span.textContent = value == null ? "" : String(value);
        return span.innerHTML;
    }

    function resultCell(job) {
        if (job.status === "completed" && job.result_file_url) {
            return `<a href="${escapeText(job.result_file_url)}" target="_blank" rel="noopener">Open PDF</a>`;
        }
        if (job.status === "failed") {
            return escapeText(job.error_message || job.error_code || "Generation failed");
        }
        return "Pending";
    }

    function reviewCell(job) {
        if (job.review_status) {
            return escapeText(job.review_status.replace("_", " "));
        }
        return job.status === "completed" ? "Not reviewed" : "";
    }

    function actionsCell(job) {
        if (job.status !== "completed" || !job.result_file_url) {
            return "";
        }
        return `<div class="lucia-catalog-actions">
            <button class="button button-small" data-review-status="approved" data-job-id="${escapeText(job.job_id)}" type="button">Approve</button>
            <button class="button button-small" data-review-status="needs_changes" data-job-id="${escapeText(job.job_id)}" type="button">Needs changes</button>
        </div>`;
    }

    function renderJobs(jobs) {
        if (!Array.isArray(jobs) || jobs.length === 0) {
            jobsBody.innerHTML = `<tr><td colspan="6">No catalog jobs yet.</td></tr>`;
            return;
        }

        jobsBody.innerHTML = jobs.map((job) => `<tr data-job-id="${escapeText(job.job_id)}">
            <td>${escapeText(job.created_at_local || job.created_at || "")}</td>
            <td>${escapeText(job.catalog_title || "")}</td>
            <td>${escapeText(statusLabel(job))}</td>
            <td>${resultCell(job)}</td>
            <td>${reviewCell(job)}</td>
            <td>${actionsCell(job)}</td>
        </tr>`).join("");
    }

    async function loadRecentJobs() {
        const jobs = await postCatalogAction("lucia_catalog_console_recent_jobs", { limit: "10" });
        renderJobs(jobs);
        return jobs;
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    async function pollActiveJob() {
        if (!activeJobId) {
            return;
        }
        const job = await postCatalogAction("lucia_catalog_console_get_job", { job_id: activeJobId });
        await loadRecentJobs();
        if (job.status === "completed") {
            setStatus("Catalog PDF is ready.", "success");
            stopPolling();
            generateButton.disabled = false;
        } else if (job.status === "failed") {
            setStatus(job.error_message || "Catalog generation failed.", "error");
            stopPolling();
            generateButton.disabled = false;
        } else {
            setStatus(`Catalog job ${statusLabel(job)}...`, "info");
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearStatus();
        generateButton.disabled = true;
        const formData = new FormData(form);
        try {
            const job = await postCatalogAction("lucia_catalog_console_queue", Object.fromEntries(formData.entries()));
            activeJobId = job.job_id || "";
            setStatus("Catalog job queued.", "success");
            await loadRecentJobs();
            stopPolling();
            pollTimer = window.setInterval(() => {
                pollActiveJob().catch((error) => {
                    setStatus(error.message, "error");
                    stopPolling();
                    generateButton.disabled = false;
                });
            }, 5000);
            await pollActiveJob();
        } catch (error) {
            setStatus(error.message, "error");
            generateButton.disabled = false;
        }
    });

    jobsBody.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-review-status][data-job-id]");
        if (!button) {
            return;
        }
        button.disabled = true;
        try {
            await postCatalogAction("lucia_catalog_console_review", {
                job_id: button.dataset.jobId,
                review_status: button.dataset.reviewStatus,
            });
            setStatus("Catalog review saved.", "success");
            await loadRecentJobs();
        } catch (error) {
            setStatus(error.message, "error");
            button.disabled = false;
        }
    });

    loadRecentJobs().catch((error) => {
        setStatus(error.message, "error");
        jobsBody.innerHTML = `<tr><td colspan="6">Unable to load catalog jobs.</td></tr>`;
    });
})();
    </script>';

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
