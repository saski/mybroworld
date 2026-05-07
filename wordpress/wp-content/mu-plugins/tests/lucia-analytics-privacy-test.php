<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);

$GLOBALS['lucia_analytics_privacy_test_filters'] = [];
$GLOBALS['lucia_analytics_privacy_test_endpoint'] = null;

function add_filter(string $hook, callable|string $callback, int $priority = 10, int $acceptedArgs = 1): void
{
    $GLOBALS['lucia_analytics_privacy_test_filters'][] = [
        'hook' => $hook,
        'callback' => is_string($callback) ? $callback : 'callable',
        'priority' => $priority,
        'accepted_args' => $acceptedArgs,
    ];
}

function is_wc_endpoint_url(string $endpoint): bool
{
    return $GLOBALS['lucia_analytics_privacy_test_endpoint'] === $endpoint;
}

require __DIR__ . '/../lucia-analytics-privacy.php';

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

$GLOBALS['lucia_analytics_privacy_test_endpoint'] = 'order-pay';
assertSameValue(
    true,
    lucia_analytics_privacy_block_sitekit_analytics_tag(false),
    'Site Kit analytics should be blocked on payment endpoints that can contain order keys.',
);

$GLOBALS['lucia_analytics_privacy_test_endpoint'] = 'order-received';
assertSameValue(
    true,
    lucia_analytics_privacy_block_sitekit_analytics_tag(false),
    'Site Kit analytics should be blocked on order confirmation endpoints that can contain order keys.',
);

$GLOBALS['lucia_analytics_privacy_test_endpoint'] = 'checkout';
assertSameValue(
    false,
    lucia_analytics_privacy_block_sitekit_analytics_tag(false),
    'Normal checkout pages should keep Site Kit analytics available.',
);

assertSameValue(
    true,
    lucia_analytics_privacy_block_sitekit_analytics_tag(true),
    'An upstream Site Kit block decision should be preserved.',
);

assertSameValue(
    [
        [
            'hook' => 'googlesitekit_analytics-4_tag_blocked',
            'callback' => 'lucia_analytics_privacy_block_sitekit_analytics_tag',
            'priority' => 10,
            'accepted_args' => 1,
        ],
        [
            'hook' => 'googlesitekit_analytics_tag_blocked',
            'callback' => 'lucia_analytics_privacy_block_sitekit_analytics_tag',
            'priority' => 10,
            'accepted_args' => 1,
        ],
    ],
    $GLOBALS['lucia_analytics_privacy_test_filters'],
    'Both GA4 and legacy Site Kit analytics snippets should be protected on sensitive endpoints.',
);
