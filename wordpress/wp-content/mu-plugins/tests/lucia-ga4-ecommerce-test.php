<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);

$GLOBALS['lucia_ga4_ecommerce_test_actions'] = [];
$GLOBALS['lucia_ga4_ecommerce_test_scripts'] = [];

function add_action(string $hook, callable|string $callback, int $priority = 10, int $acceptedArgs = 1): void
{
    $GLOBALS['lucia_ga4_ecommerce_test_actions'][] = [
        'hook' => $hook,
        'callback' => is_string($callback) ? $callback : 'callable',
        'priority' => $priority,
        'accepted_args' => $acceptedArgs,
    ];
}

function plugins_url(string $path, string $pluginFile): string
{
    return 'https://www.luciastuy.test/wp-content/mu-plugins/' . ltrim($path, '/');
}

function wp_enqueue_script(string $handle, string $src, array $deps = [], string|bool|null $ver = false, bool $inFooter = false): void
{
    $GLOBALS['lucia_ga4_ecommerce_test_scripts'][$handle] = [
        'src' => $src,
        'deps' => $deps,
        'ver' => $ver,
        'in_footer' => $inFooter,
    ];
}

function wp_json_encode(mixed $data, int $options = 0): string
{
    return json_encode($data, $options) ?: '';
}

function wp_strip_all_tags(string $text): string
{
    return strip_tags($text);
}

function apply_filters(string $hookName, mixed $value): mixed
{
    return $value;
}

final class LuciaGa4EcommerceTestProduct
{
    public function __construct(
        private readonly int $id,
        private readonly string $sku,
        private readonly string $name,
        private readonly string $price,
        private readonly array $meta,
    ) {
    }

    public function get_id(): int
    {
        return $this->id;
    }

    public function get_sku(): string
    {
        return $this->sku;
    }

    public function get_name(): string
    {
        return $this->name;
    }

    public function get_price(): string
    {
        return $this->price;
    }

    public function get_meta(string $key, bool $single = true): mixed
    {
        return $this->meta[$key] ?? '';
    }
}

final class LuciaGa4EcommerceTestOrderItem
{
    public function __construct(
        private readonly LuciaGa4EcommerceTestProduct $product,
        private readonly int $quantity,
        private readonly string $total,
    ) {
    }

    public function get_product(): LuciaGa4EcommerceTestProduct
    {
        return $this->product;
    }

    public function get_quantity(): int
    {
        return $this->quantity;
    }

    public function get_total(): string
    {
        return $this->total;
    }
}

final class LuciaGa4EcommerceTestOrder
{
    public function __construct(
        private readonly int $id,
        private readonly array $items,
        private readonly string $tax,
        private readonly string $shipping,
    ) {
    }

    public function get_id(): int
    {
        return $this->id;
    }

    public function get_items(): array
    {
        return $this->items;
    }

    public function get_total_tax(): string
    {
        return $this->tax;
    }

    public function get_shipping_total(): string
    {
        return $this->shipping;
    }
}

function wc_get_product(mixed $product): mixed
{
    $productId = is_object($product) && isset($product->ID) ? (int) $product->ID : 0;
    if (is_int($product) || is_string($product)) {
        $productId = (int) $product;
    }

    return $GLOBALS['lucia_ga4_ecommerce_test_products'][$productId] ?? null;
}

require __DIR__ . '/../lucia-ga4-ecommerce.php';

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

$availableArtwork = new LuciaGa4EcommerceTestProduct(
    16610,
    'LA-2026-013',
    '<strong>Algunas situaciones requieres dos de azucar</strong>',
    '320.00',
    [
        '_lucia_artwork_id' => 'LA-2026-013',
        '_lucia_series_name' => 'Family scenes',
        '_lucia_artwork_status' => 'available',
    ],
);

$item = lucia_ga4_ecommerce_item_from_product($availableArtwork);

assertSameValue(
    [
        'item_id' => 'LA-2026-013',
        'item_name' => 'Algunas situaciones requieres dos de azucar',
        'item_brand' => 'Lucia Astuy',
        'item_category' => 'Artwork',
        'item_category2' => 'Family scenes',
        'item_category3' => '2026',
        'item_variant' => 'available',
        'price' => 320.0,
        'quantity' => 1,
    ],
    $item,
    'Managed WooCommerce artwork products should map to the accepted GA4 item contract.',
);

assertSameValue(
    [
        'name' => 'view_item',
        'params' => [
            'currency' => 'EUR',
            'value' => 320.0,
            'items' => [$item],
        ],
    ],
    lucia_ga4_ecommerce_view_item_event($availableArtwork),
    'Product detail views should emit the GA4 view_item payload with currency, value, and item data.',
);

assertSameValue(
    [
        'name' => 'view_item_list',
        'params' => [
            'currency' => 'EUR',
            'value' => 320.0,
            'item_list_id' => 'shop',
            'item_list_name' => 'Shop',
            'items' => [
                $item + [
                    'item_list_id' => 'shop',
                    'item_list_name' => 'Shop',
                    'index' => 1,
                ],
            ],
        ],
    ],
    lucia_ga4_ecommerce_view_item_list_event([$availableArtwork], 'shop', 'Shop'),
    'Product lists should emit view_item_list with stable list context and indexed items.',
);

$GLOBALS['lucia_ga4_ecommerce_test_products'] = [16610 => $availableArtwork];
$GLOBALS['wp_query'] = (object) [
    'posts' => [(object) ['ID' => 16610]],
];
$GLOBALS['lucia_ga4_ecommerce_product_items'] = [];
$GLOBALS['lucia_ga4_ecommerce_loop_products'] = [];

assertSameValue(
    [
        lucia_ga4_ecommerce_view_item_list_event([$availableArtwork], 'shop', 'Shop'),
    ],
    lucia_ga4_ecommerce_initial_events(),
    'Product archive query products should emit view_item_list even when the theme skips the standard loop hook.',
);

assertSameValue(
    ['16610' => $item],
    lucia_ga4_ecommerce_product_items(),
    'Product archive query products should populate the frontend product map for add_to_cart events.',
);

assertSameValue(
    [
        'name' => 'view_cart',
        'params' => [
            'currency' => 'EUR',
            'value' => 320.0,
            'items' => [$item],
        ],
    ],
    lucia_ga4_ecommerce_cart_event('view_cart', [$item]),
    'Cart views should emit the GA4 view_cart payload for current cart contents.',
);

assertSameValue(
    [
        'name' => 'begin_checkout',
        'params' => [
            'currency' => 'EUR',
            'value' => 320.0,
            'items' => [$item],
        ],
    ],
    lucia_ga4_ecommerce_cart_event('begin_checkout', [$item]),
    'Checkout entry should emit the GA4 begin_checkout payload for checkout contents.',
);

$purchaseItem = $item;
$purchaseItem['price'] = 300.0;

assertSameValue(
    [
        'name' => 'purchase',
        'params' => [
            'transaction_id' => '9001',
            'currency' => 'EUR',
            'value' => 300.0,
            'tax' => 63.0,
            'shipping' => 5.0,
            'items' => [$purchaseItem],
        ],
    ],
    lucia_ga4_ecommerce_purchase_event(new LuciaGa4EcommerceTestOrder(
        9001,
        [new LuciaGa4EcommerceTestOrderItem($availableArtwork, 1, '300.00')],
        '63.00',
        '5.00',
    )),
    'Purchase events should use sanitized order facts without buyer data or order keys.',
);

assertSameValue(
    true,
    in_array(
        [
            'hook' => 'wp_enqueue_scripts',
            'callback' => 'lucia_ga4_ecommerce_enqueue_assets',
            'priority' => 10,
            'accepted_args' => 1,
        ],
        $GLOBALS['lucia_ga4_ecommerce_test_actions'],
        true,
    ),
    'The ecommerce mu-plugin should enqueue its owned frontend asset.',
);

lucia_ga4_ecommerce_enqueue_assets();

assertSameValue(
    true,
    isset($GLOBALS['lucia_ga4_ecommerce_test_scripts']['lucia-ga4-ecommerce']),
    'The ecommerce frontend asset should be enqueued.',
);

ob_start();
lucia_ga4_ecommerce_render_config_script(
    [
        lucia_ga4_ecommerce_view_item_event($availableArtwork),
        lucia_ga4_ecommerce_cart_event('view_cart', [$item]),
    ],
    ['16610' => $item],
);
$configScript = ob_get_clean();

assertSameValue(true, str_contains($configScript, 'window.luciaGa4Ecommerce'), 'Frontend config should be exposed for the owned JS emitter.');
assertSameValue(true, str_contains($configScript, '"view_item"'), 'Frontend config should include initial ecommerce events.');
assertSameValue(true, str_contains($configScript, '"16610"'), 'Frontend config should include a product map for click events.');
assertSameValue(false, str_contains($configScript, 'wc_order_'), 'Frontend config must not expose WooCommerce order keys.');

$frontendAsset = file_get_contents(__DIR__ . '/../assets/lucia-ga4-ecommerce.js') ?: '';

assertSameValue(true, str_contains($frontendAsset, "window.addEventListener('load', sendInitialEvents"), 'Frontend asset should wait for the Google tag before sending initial ecommerce events.');
assertSameValue(true, str_contains($frontendAsset, 'select_item'), 'Frontend asset should emit select_item from product clicks.');
assertSameValue(true, str_contains($frontendAsset, 'add_to_cart'), 'Frontend asset should emit add_to_cart from WooCommerce add-to-cart interactions.');
assertSameValue(true, str_contains($frontendAsset, 'remove_from_cart'), 'Frontend asset should emit remove_from_cart from WooCommerce cart removal interactions.');
assertSameValue(true, str_contains($frontendAsset, 'luciastuy_analytics_consent'), 'Frontend asset should honor the owned analytics consent choice.');
