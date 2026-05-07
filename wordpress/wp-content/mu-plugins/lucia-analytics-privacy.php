<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function lucia_analytics_privacy_sensitive_woocommerce_endpoints(): array
{
    return [
        'order-pay',
        'order-received',
    ];
}

function lucia_analytics_privacy_is_sensitive_woocommerce_endpoint(): bool
{
    if (! function_exists('is_wc_endpoint_url')) {
        return false;
    }

    foreach (lucia_analytics_privacy_sensitive_woocommerce_endpoints() as $endpoint) {
        if (is_wc_endpoint_url($endpoint)) {
            return true;
        }
    }

    return false;
}

function lucia_analytics_privacy_block_sitekit_analytics_tag(bool $blocked): bool
{
    if ($blocked) {
        return true;
    }

    return lucia_analytics_privacy_is_sensitive_woocommerce_endpoint();
}

add_filter('googlesitekit_analytics-4_tag_blocked', 'lucia_analytics_privacy_block_sitekit_analytics_tag');
add_filter('googlesitekit_analytics_tag_blocked', 'lucia_analytics_privacy_block_sitekit_analytics_tag');
