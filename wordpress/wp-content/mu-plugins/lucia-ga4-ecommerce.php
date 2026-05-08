<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function lucia_ga4_ecommerce_clean_text(mixed $value): string
{
    $text = (string) $value;

    if (function_exists('wp_strip_all_tags')) {
        $text = wp_strip_all_tags($text);
    } else {
        $text = strip_tags($text);
    }

    return trim(html_entity_decode($text, ENT_QUOTES, 'UTF-8'));
}

function lucia_ga4_ecommerce_valid_artwork_id(string $value): bool
{
    return preg_match('/^LA-\d{4}-\d+$/', $value) === 1;
}

function lucia_ga4_ecommerce_product_meta(object $product, string $key): string
{
    if (! method_exists($product, 'get_meta')) {
        return '';
    }

    return lucia_ga4_ecommerce_clean_text($product->get_meta($key, true));
}

function lucia_ga4_ecommerce_product_artwork_id(object $product): string
{
    $metaArtworkId = lucia_ga4_ecommerce_product_meta($product, '_lucia_artwork_id');
    if (lucia_ga4_ecommerce_valid_artwork_id($metaArtworkId)) {
        return $metaArtworkId;
    }

    if (! method_exists($product, 'get_sku')) {
        return '';
    }

    $sku = lucia_ga4_ecommerce_clean_text($product->get_sku());

    return lucia_ga4_ecommerce_valid_artwork_id($sku) ? $sku : '';
}

function lucia_ga4_ecommerce_product_year(object $product, string $artworkId): string
{
    $year = lucia_ga4_ecommerce_product_meta($product, '_lucia_artwork_year');
    if (preg_match('/^\d{4}$/', $year) === 1) {
        return $year;
    }

    if (preg_match('/^LA-(\d{4})-\d+$/', $artworkId, $matches) !== 1) {
        return '';
    }

    return $matches[1];
}

function lucia_ga4_ecommerce_product_status(object $product): string
{
    $status = lucia_ga4_ecommerce_product_meta($product, '_lucia_artwork_status');

    if (function_exists('lucia_normalize_artwork_status')) {
        return lucia_normalize_artwork_status($status);
    }

    return preg_match('/^[a-z0-9_]+$/', $status) === 1 ? $status : '';
}

function lucia_ga4_ecommerce_product_price(object $product): ?float
{
    if (! method_exists($product, 'get_price')) {
        return null;
    }

    $price = (string) $product->get_price();
    if ($price === '' || ! is_numeric($price)) {
        return null;
    }

    return (float) $price;
}

function lucia_ga4_ecommerce_item_from_product(object $product, int $quantity = 1): ?array
{
    $artworkId = lucia_ga4_ecommerce_product_artwork_id($product);
    if ($artworkId === '' || ! method_exists($product, 'get_name')) {
        return null;
    }

    $item = [
        'item_id' => $artworkId,
        'item_name' => lucia_ga4_ecommerce_clean_text($product->get_name()),
        'item_brand' => 'Lucia Astuy',
        'item_category' => 'Artwork',
    ];

    $series = lucia_ga4_ecommerce_product_meta($product, '_lucia_series_name');
    if ($series !== '') {
        $item['item_category2'] = $series;
    }

    $year = lucia_ga4_ecommerce_product_year($product, $artworkId);
    if ($year !== '') {
        $item['item_category3'] = $year;
    }

    $status = lucia_ga4_ecommerce_product_status($product);
    if ($status !== '') {
        $item['item_variant'] = $status;
    }

    $price = lucia_ga4_ecommerce_product_price($product);
    if ($price !== null) {
        $item['price'] = $price;
    }

    $item['quantity'] = max(1, $quantity);

    return $item;
}

function lucia_ga4_ecommerce_currency(): string
{
    return 'EUR';
}

function lucia_ga4_ecommerce_value_from_items(array $items): ?float
{
    $value = 0.0;
    $hasPrice = false;

    foreach ($items as $item) {
        if (! isset($item['price']) || ! is_numeric($item['price'])) {
            continue;
        }

        $quantity = isset($item['quantity']) && is_numeric($item['quantity']) ? (int) $item['quantity'] : 1;
        $value += (float) $item['price'] * max(1, $quantity);
        $hasPrice = true;
    }

    return $hasPrice ? $value : null;
}

function lucia_ga4_ecommerce_event(string $name, array $params): array
{
    return [
        'name' => $name,
        'params' => $params,
    ];
}

function lucia_ga4_ecommerce_items_event(string $name, array $items, array $params = []): ?array
{
    if ($items === []) {
        return null;
    }

    $eventParams = [];
    $value = lucia_ga4_ecommerce_value_from_items($items);
    if ($value !== null) {
        $eventParams['currency'] = lucia_ga4_ecommerce_currency();
        $eventParams['value'] = $value;
    }

    $eventParams = array_merge($eventParams, $params);
    $eventParams['items'] = $items;

    return lucia_ga4_ecommerce_event($name, $eventParams);
}

function lucia_ga4_ecommerce_view_item_event(object $product): ?array
{
    $item = lucia_ga4_ecommerce_item_from_product($product);
    if ($item === null) {
        return null;
    }

    return lucia_ga4_ecommerce_items_event('view_item', [$item]);
}

function lucia_ga4_ecommerce_view_item_list_event(array $products, string $listId, string $listName): ?array
{
    $items = [];
    $index = 1;

    foreach ($products as $product) {
        if (! is_object($product)) {
            continue;
        }

        $item = lucia_ga4_ecommerce_item_from_product($product);
        if ($item === null) {
            continue;
        }

        $item['item_list_id'] = $listId;
        $item['item_list_name'] = $listName;
        $item['index'] = $index;
        $items[] = $item;
        $index++;
    }

    return lucia_ga4_ecommerce_items_event(
        'view_item_list',
        $items,
        [
            'item_list_id' => $listId,
            'item_list_name' => $listName,
        ],
    );
}

function lucia_ga4_ecommerce_cart_event(string $eventName, array $items): ?array
{
    if (! in_array($eventName, ['view_cart', 'begin_checkout'], true)) {
        return null;
    }

    return lucia_ga4_ecommerce_items_event($eventName, $items);
}

function lucia_ga4_ecommerce_float_or_null(mixed $value): ?float
{
    if ($value === '' || ! is_numeric($value)) {
        return null;
    }

    return (float) $value;
}

function lucia_ga4_ecommerce_item_from_order_item(object $orderItem): ?array
{
    if (! method_exists($orderItem, 'get_product')) {
        return null;
    }

    $product = $orderItem->get_product();
    if (! is_object($product)) {
        return null;
    }

    $quantity = method_exists($orderItem, 'get_quantity') ? (int) $orderItem->get_quantity() : 1;
    $item = lucia_ga4_ecommerce_item_from_product($product, max(1, $quantity));
    if ($item === null) {
        return null;
    }

    if (method_exists($orderItem, 'get_total')) {
        $lineTotal = lucia_ga4_ecommerce_float_or_null($orderItem->get_total());
        if ($lineTotal !== null) {
            $item['price'] = $lineTotal / max(1, $quantity);
        }
    }

    return $item;
}

function lucia_ga4_ecommerce_purchase_event(object $order): ?array
{
    if (! method_exists($order, 'get_id') || ! method_exists($order, 'get_items')) {
        return null;
    }

    $items = [];
    foreach ($order->get_items() as $orderItem) {
        if (! is_object($orderItem)) {
            continue;
        }

        $item = lucia_ga4_ecommerce_item_from_order_item($orderItem);
        if ($item !== null) {
            $items[] = $item;
        }
    }

    if ($items === []) {
        return null;
    }

    $params = [
        'transaction_id' => (string) $order->get_id(),
        'currency' => lucia_ga4_ecommerce_currency(),
        'value' => lucia_ga4_ecommerce_value_from_items($items) ?? 0.0,
    ];

    if (method_exists($order, 'get_total_tax')) {
        $tax = lucia_ga4_ecommerce_float_or_null($order->get_total_tax());
        if ($tax !== null) {
            $params['tax'] = $tax;
        }
    }

    if (method_exists($order, 'get_shipping_total')) {
        $shipping = lucia_ga4_ecommerce_float_or_null($order->get_shipping_total());
        if ($shipping !== null) {
            $params['shipping'] = $shipping;
        }
    }

    $params['items'] = $items;

    return lucia_ga4_ecommerce_event('purchase', $params);
}

function lucia_ga4_ecommerce_asset_version(string $relativePath): string
{
    $assetPath = __DIR__ . '/' . ltrim($relativePath, '/');

    return file_exists($assetPath) ? (string) filemtime($assetPath) : '1';
}

function lucia_ga4_ecommerce_enqueue_assets(): void
{
    if (lucia_ga4_ecommerce_is_order_received_endpoint()) {
        $tagId = lucia_ga4_ecommerce_google_tag_id();
        wp_enqueue_script(
            'lucia-ga4-ecommerce-gtag',
            'https://www.googletagmanager.com/gtag/js?id=' . rawurlencode($tagId),
            [],
            null,
            false,
        );

        if (function_exists('wp_add_inline_script')) {
            wp_add_inline_script(
                'lucia-ga4-ecommerce-gtag',
                'window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window.gtag("js",new Date());window.gtag("config",' . wp_json_encode($tagId) . ',{"send_page_view":false});',
                'after',
            );
        }
    }

    wp_enqueue_script(
        'lucia-ga4-ecommerce',
        plugins_url('assets/lucia-ga4-ecommerce.js', __FILE__),
        [],
        lucia_ga4_ecommerce_asset_version('assets/lucia-ga4-ecommerce.js'),
        true,
    );
}

function lucia_ga4_ecommerce_google_tag_id(): string
{
    return (string) apply_filters('lucia_ga4_ecommerce_google_tag_id', 'GT-M6B9CMXM');
}

function lucia_ga4_ecommerce_product_id(object $product): string
{
    if (! method_exists($product, 'get_id')) {
        return '';
    }

    $productId = (int) $product->get_id();

    return $productId > 0 ? (string) $productId : '';
}

function lucia_ga4_ecommerce_product_items(): array
{
    if (! isset($GLOBALS['lucia_ga4_ecommerce_product_items']) || ! is_array($GLOBALS['lucia_ga4_ecommerce_product_items'])) {
        $GLOBALS['lucia_ga4_ecommerce_product_items'] = [];
    }

    return $GLOBALS['lucia_ga4_ecommerce_product_items'];
}

function lucia_ga4_ecommerce_register_product_item(object $product, int $quantity = 1): ?array
{
    $productId = lucia_ga4_ecommerce_product_id($product);
    $item = lucia_ga4_ecommerce_item_from_product($product, $quantity);

    if ($productId === '' || $item === null) {
        return $item;
    }

    $GLOBALS['lucia_ga4_ecommerce_product_items'][$productId] = $item;

    return $item;
}

function lucia_ga4_ecommerce_collect_loop_item(): void
{
    $product = $GLOBALS['product'] ?? null;
    if (! is_object($product)) {
        return;
    }

    lucia_ga4_ecommerce_register_product_item($product);

    if (! isset($GLOBALS['lucia_ga4_ecommerce_loop_products']) || ! is_array($GLOBALS['lucia_ga4_ecommerce_loop_products'])) {
        $GLOBALS['lucia_ga4_ecommerce_loop_products'] = [];
    }

    $GLOBALS['lucia_ga4_ecommerce_loop_products'][] = $product;
}

function lucia_ga4_ecommerce_loop_products(): array
{
    if (
        isset($GLOBALS['lucia_ga4_ecommerce_loop_products'])
        && is_array($GLOBALS['lucia_ga4_ecommerce_loop_products'])
        && $GLOBALS['lucia_ga4_ecommerce_loop_products'] !== []
    ) {
        return $GLOBALS['lucia_ga4_ecommerce_loop_products'];
    }

    return lucia_ga4_ecommerce_query_products();
}

function lucia_ga4_ecommerce_query_products(): array
{
    if (! function_exists('wc_get_product')) {
        return [];
    }

    if (function_exists('is_product') && is_product()) {
        return [];
    }

    $query = $GLOBALS['wp_query'] ?? null;
    if (! is_object($query) || ! isset($query->posts) || ! is_array($query->posts)) {
        return [];
    }

    $products = [];
    $seenProductIds = [];

    foreach ($query->posts as $post) {
        $product = wc_get_product($post);
        if (! is_object($product)) {
            continue;
        }

        $productId = lucia_ga4_ecommerce_product_id($product);
        if ($productId === '' || isset($seenProductIds[$productId])) {
            continue;
        }

        $seenProductIds[$productId] = true;
        lucia_ga4_ecommerce_register_product_item($product);
        $products[] = $product;
    }

    return $products;
}

function lucia_ga4_ecommerce_current_product(): ?object
{
    $product = $GLOBALS['product'] ?? null;
    if (is_object($product)) {
        return $product;
    }

    if (! function_exists('wc_get_product') || ! function_exists('get_the_ID')) {
        return null;
    }

    $currentProduct = wc_get_product(get_the_ID());

    return is_object($currentProduct) ? $currentProduct : null;
}

function lucia_ga4_ecommerce_cart_items_from_woocommerce(): array
{
    if (! function_exists('WC') || ! is_object(WC()) || ! isset(WC()->cart) || ! is_object(WC()->cart)) {
        return [];
    }

    $items = [];
    foreach (WC()->cart->get_cart() as $cartItem) {
        if (! is_array($cartItem) || ! isset($cartItem['data']) || ! is_object($cartItem['data'])) {
            continue;
        }

        $quantity = isset($cartItem['quantity']) ? (int) $cartItem['quantity'] : 1;
        $item = lucia_ga4_ecommerce_register_product_item($cartItem['data'], max(1, $quantity));
        if ($item !== null) {
            $items[] = $item;
        }
    }

    return $items;
}

function lucia_ga4_ecommerce_is_order_received_endpoint(): bool
{
    return function_exists('is_wc_endpoint_url') && is_wc_endpoint_url('order-received');
}

function lucia_ga4_ecommerce_order_received_order(): ?object
{
    if (! lucia_ga4_ecommerce_is_order_received_endpoint() || ! function_exists('get_query_var') || ! function_exists('wc_get_order')) {
        return null;
    }

    $orderId = (int) get_query_var('order-received');
    if ($orderId <= 0) {
        return null;
    }

    $order = wc_get_order($orderId);

    return is_object($order) ? $order : null;
}

function lucia_ga4_ecommerce_list_context(): array
{
    if (function_exists('is_product') && is_product()) {
        return ['related_artworks', 'Related artworks'];
    }

    if (function_exists('is_search') && is_search()) {
        return ['search_results', 'Search results'];
    }

    return ['shop', 'Shop'];
}

function lucia_ga4_ecommerce_initial_events(): array
{
    $events = [];

    if (function_exists('is_product') && is_product()) {
        $product = lucia_ga4_ecommerce_current_product();
        if ($product !== null) {
            lucia_ga4_ecommerce_register_product_item($product);
            $events[] = lucia_ga4_ecommerce_view_item_event($product);
        }
    }

    $loopProducts = lucia_ga4_ecommerce_loop_products();
    if ($loopProducts !== []) {
        [$listId, $listName] = lucia_ga4_ecommerce_list_context();
        $events[] = lucia_ga4_ecommerce_view_item_list_event($loopProducts, $listId, $listName);
    }

    $cartItems = lucia_ga4_ecommerce_cart_items_from_woocommerce();
    if ($cartItems !== []) {
        if (function_exists('is_cart') && is_cart()) {
            $events[] = lucia_ga4_ecommerce_cart_event('view_cart', $cartItems);
        }

        if (
            function_exists('is_checkout')
            && is_checkout()
            && ! lucia_ga4_ecommerce_is_order_received_endpoint()
            && (! function_exists('is_wc_endpoint_url') || ! is_wc_endpoint_url('order-pay'))
        ) {
            $events[] = lucia_ga4_ecommerce_cart_event('begin_checkout', $cartItems);
        }
    }

    $order = lucia_ga4_ecommerce_order_received_order();
    if ($order !== null) {
        $events[] = lucia_ga4_ecommerce_purchase_event($order);
    }

    return array_values(array_filter($events));
}

function lucia_ga4_ecommerce_render_config_script(array $events, array $products): void
{
    $config = [
        'currency' => lucia_ga4_ecommerce_currency(),
        'events' => array_values(array_filter($events)),
        'products' => $products,
        'consentStorageKey' => function_exists('lucia_consent_banner_storage_key')
            ? lucia_consent_banner_storage_key()
            : 'luciastuy_analytics_consent',
    ];

    ?>
    <script id="lucia-ga4-ecommerce-config">
    window.luciaGa4Ecommerce = <?php echo wp_json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>;
    </script>
    <?php
}

function lucia_ga4_ecommerce_render_footer_config(): void
{
    lucia_ga4_ecommerce_render_config_script(
        lucia_ga4_ecommerce_initial_events(),
        lucia_ga4_ecommerce_product_items(),
    );
}

add_action('wp_enqueue_scripts', 'lucia_ga4_ecommerce_enqueue_assets');
add_action('woocommerce_after_shop_loop_item', 'lucia_ga4_ecommerce_collect_loop_item', 30);
add_action('wp_footer', 'lucia_ga4_ecommerce_render_footer_config', 5);
