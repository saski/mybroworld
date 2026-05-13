<?php

if (! defined('ABSPATH')) {
    fwrite(STDERR, "This script must run through WP-CLI eval-file.\n");
    exit(1);
}

if (! class_exists('WooCommerce')) {
    fwrite(STDERR, "WooCommerce must be active before checkout readiness can be repaired.\n");
    exit(1);
}

$store_country = getenv('WP_LOCAL_STORE_COUNTRY') ?: 'ES';
$store_currency = getenv('WP_LOCAL_STORE_CURRENCY') ?: 'EUR';

update_option('woocommerce_currency', $store_currency);
update_option('woocommerce_default_country', $store_country);
update_option('woocommerce_allowed_countries', 'all');
update_option('woocommerce_ship_to_countries', '');
update_option('woocommerce_ship_to_destination', 'billing');
update_option('woocommerce_enable_shipping_calc', 'yes');

$bacs_settings = get_option('woocommerce_bacs_settings', []);
if (! is_array($bacs_settings)) {
    $bacs_settings = [];
}
$bacs_settings['enabled'] = 'yes';
update_option('woocommerce_bacs_settings', $bacs_settings);

foreach (['cheque', 'cod'] as $gateway_id) {
    $settings_key = sprintf('woocommerce_%s_settings', $gateway_id);
    $settings = get_option($settings_key, []);
    if (! is_array($settings)) {
        $settings = [];
    }
    $settings['enabled'] = 'no';
    update_option($settings_key, $settings);
}

$zone_name = 'Local checkout validation';
$target_zone = null;

foreach (WC_Shipping_Zones::get_zones() as $zone_data) {
    if (($zone_data['zone_name'] ?? '') === $zone_name) {
        $target_zone = new WC_Shipping_Zone((int) $zone_data['id']);
        break;
    }
}

if (! $target_zone instanceof WC_Shipping_Zone) {
    $target_zone = new WC_Shipping_Zone();
    $target_zone->set_zone_name($zone_name);
    $target_zone->add_location($store_country, 'country');
    $target_zone->save();
}

$flat_rate_instance_id = 0;
foreach ($target_zone->get_shipping_methods() as $method) {
    if ($method->id === 'flat_rate') {
        $flat_rate_instance_id = (int) $method->instance_id;
        break;
    }
}

if ($flat_rate_instance_id <= 0) {
    $flat_rate_instance_id = (int) $target_zone->add_shipping_method('flat_rate');
}

$flat_rate_settings_key = sprintf('woocommerce_flat_rate_%d_settings', $flat_rate_instance_id);
$flat_rate_settings = get_option($flat_rate_settings_key, []);
if (! is_array($flat_rate_settings)) {
    $flat_rate_settings = [];
}

$flat_rate_settings['cost'] = '0';
$flat_rate_settings['enabled'] = 'yes';
$flat_rate_settings['tax_status'] = 'none';
$flat_rate_settings['title'] = 'Shipping coordination';
update_option($flat_rate_settings_key, $flat_rate_settings);

echo sprintf(
    "ensured_checkout_readiness currency=%s country=%s payment_gateway=bacs shipping_zone=%s\n",
    $store_currency,
    $store_country,
    $zone_name
);
