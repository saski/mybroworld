<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);

$GLOBALS['lucia_consent_test_actions'] = [];
$GLOBALS['lucia_consent_test_scripts'] = [];
$GLOBALS['lucia_consent_test_styles'] = [];

function add_action(string $hook, callable|string $callback, int $priority = 10): void
{
    $GLOBALS['lucia_consent_test_actions'][] = [
        'hook' => $hook,
        'callback' => is_string($callback) ? $callback : 'callable',
        'priority' => $priority,
    ];
}

function plugins_url(string $path, string $pluginFile): string
{
    return 'https://www.luciastuy.test/wp-content/mu-plugins/' . ltrim($path, '/');
}

function wp_enqueue_script(string $handle, string $src, array $deps = [], string|bool|null $ver = false, bool $inFooter = false): void
{
    $GLOBALS['lucia_consent_test_scripts'][$handle] = [
        'src' => $src,
        'deps' => $deps,
        'ver' => $ver,
        'in_footer' => $inFooter,
    ];
}

function wp_enqueue_style(string $handle, string $src, array $deps = [], string|bool|null $ver = false): void
{
    $GLOBALS['lucia_consent_test_styles'][$handle] = [
        'src' => $src,
        'deps' => $deps,
        'ver' => $ver,
    ];
}

function esc_attr(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function esc_html(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function wp_json_encode(mixed $data, int $options = 0): string
{
    return json_encode($data, $options) ?: '';
}

require __DIR__ . '/../lucia-consent-banner.php';

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

$defaultConsent = lucia_consent_banner_default_state();

assertSameValue('denied', $defaultConsent['ad_storage'] ?? null, 'Ad storage should stay denied by default.');
assertSameValue('denied', $defaultConsent['ad_user_data'] ?? null, 'Ad user data should stay denied by default.');
assertSameValue('denied', $defaultConsent['ad_personalization'] ?? null, 'Ad personalization should stay denied by default.');
assertSameValue('denied', $defaultConsent['analytics_storage'] ?? null, 'Analytics storage should be denied until explicit consent.');

$grantedConsent = lucia_consent_banner_state_for_choice('granted');
$deniedConsent = lucia_consent_banner_state_for_choice('denied');

assertSameValue('granted', $grantedConsent['analytics_storage'] ?? null, 'Accepting should grant analytics storage.');
assertSameValue('denied', $grantedConsent['ad_storage'] ?? null, 'Accepting analytics should not grant ad storage.');
assertSameValue('denied', $deniedConsent['analytics_storage'] ?? null, 'Rejecting should deny analytics storage.');

ob_start();
lucia_consent_banner_render_default_script();
$headScript = ob_get_clean();

assertSameValue(true, str_contains($headScript, "gtag('consent', 'default'"), 'Head script should set default consent before Google tags run.');
assertSameValue(true, str_contains($headScript, 'luciastuy_analytics_consent'), 'Head script should read the stored consent choice.');
assertSameValue(true, str_contains($headScript, '"analytics_storage":"denied"'), 'Head script should include denied analytics default.');

ob_start();
lucia_consent_banner_render_banner();
$banner = ob_get_clean();

assertSameValue(true, str_contains($banner, 'class="lucia-consent-banner"'), 'Banner should render a compact owned consent UI.');
assertSameValue(true, str_contains($banner, 'data-consent-choice="granted"'), 'Banner should include a simple accept action.');
assertSameValue(true, str_contains($banner, 'data-consent-choice="denied"'), 'Banner should include a simple reject action.');
assertSameValue(false, str_contains($banner, 'Ads'), 'Banner should not promote ads or marketing modules.');

lucia_consent_banner_enqueue_assets();

assertSameValue(true, isset($GLOBALS['lucia_consent_test_scripts']['lucia-consent-banner']), 'Consent banner script should be enqueued.');
assertSameValue(true, isset($GLOBALS['lucia_consent_test_styles']['lucia-consent-banner']), 'Consent banner style should be enqueued.');
