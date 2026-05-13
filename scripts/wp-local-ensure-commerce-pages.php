<?php

if (! defined('ABSPATH')) {
    fwrite(STDERR, "This script must run through WP-CLI eval-file.\n");
    exit(1);
}

$commerce_pages = [
    [
        'content' => '',
        'option' => 'woocommerce_shop_page_id',
        'slug' => 'shop',
        'title' => 'Shop',
    ],
    [
        'content' => '<!-- wp:shortcode -->[woocommerce_cart]<!-- /wp:shortcode -->',
        'option' => 'woocommerce_cart_page_id',
        'slug' => 'cart',
        'title' => 'Cart',
    ],
    [
        'content' => '<!-- wp:shortcode -->[woocommerce_checkout]<!-- /wp:shortcode -->',
        'option' => 'woocommerce_checkout_page_id',
        'slug' => 'checkout',
        'title' => 'Checkout',
    ],
    [
        'content' => '<!-- wp:shortcode -->[woocommerce_my_account]<!-- /wp:shortcode -->',
        'option' => 'woocommerce_myaccount_page_id',
        'slug' => 'my-account',
        'title' => 'My account',
    ],
];

function lucia_local_ensure_commerce_page(array $page): int
{
    $page_id = absint(get_option($page['option']));
    $post = $page_id > 0 ? get_post($page_id) : null;

    if (! $post instanceof WP_Post || $post->post_type !== 'page') {
        $post = get_page_by_path($page['slug'], OBJECT, 'page');
        $page_id = $post instanceof WP_Post ? (int) $post->ID : 0;
    }

    $payload = [
        'post_content' => $page['content'],
        'post_name' => $page['slug'],
        'post_status' => 'publish',
        'post_title' => $page['title'],
        'post_type' => 'page',
    ];

    if ($page_id > 0) {
        $payload['ID'] = $page_id;
        $result = wp_update_post($payload, true);
    } else {
        $result = wp_insert_post($payload, true);
    }

    if (is_wp_error($result)) {
        fwrite(STDERR, sprintf("Failed to ensure WooCommerce page %s: %s\n", $page['slug'], $result->get_error_message()));
        exit(1);
    }

    $page_id = (int) $result;
    update_option($page['option'], $page_id);

    return $page_id;
}

foreach ($commerce_pages as $commerce_page) {
    $page_id = lucia_local_ensure_commerce_page($commerce_page);
    echo sprintf("ensured_commerce_page slug=%s id=%d\n", $commerce_page['slug'], $page_id);
}
