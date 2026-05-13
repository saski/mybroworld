<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function luciastuy_theme_setup(): void
{
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce', [
        'product_grid' => [
            'default_columns' => 3,
            'default_rows' => 4,
            'max_columns' => 4,
            'min_columns' => 2,
        ],
        'single_image_width' => 1200,
        'thumbnail_image_width' => 600,
    ]);
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
    add_theme_support('html5', [
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ]);

    register_nav_menus([
        'primary' => __('Primary Navigation', 'luciastuy'),
    ]);
}
add_action('after_setup_theme', 'luciastuy_theme_setup');

function luciastuy_enqueue_assets(): void
{
    $stylesheet_path = get_stylesheet_directory() . '/style.css';
    $stylesheet_version = file_exists($stylesheet_path)
        ? (string) filemtime($stylesheet_path)
        : wp_get_theme()->get('Version');

    wp_enqueue_style(
        'luciastuy-style',
        get_stylesheet_uri(),
        [],
        $stylesheet_version
    );

    $navigation_script_path = get_stylesheet_directory() . '/assets/header-navigation.js';
    if (file_exists($navigation_script_path)) {
        wp_enqueue_script(
            'luciastuy-header-navigation',
            get_stylesheet_directory_uri() . '/assets/header-navigation.js',
            [],
            (string) filemtime($navigation_script_path),
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'luciastuy_enqueue_assets');

function luciastuy_loop_columns(): int
{
    return 3;
}
add_filter('loop_shop_columns', 'luciastuy_loop_columns');

function luciastuy_related_products_args(array $args): array
{
    $args['columns'] = 4;
    $args['posts_per_page'] = 4;

    return $args;
}
add_filter('woocommerce_output_related_products_args', 'luciastuy_related_products_args');

function luciastuy_cart_item_count(): int
{
    if (! function_exists('WC') || ! WC() || ! WC()->cart) {
        return 0;
    }

    return (int) WC()->cart->get_cart_contents_count();
}

function luciastuy_render_cart_link(): void
{
    if (! function_exists('wc_get_cart_url')) {
        return;
    }

    $count = luciastuy_cart_item_count();
    $label = sprintf(
        _n('Cart, %d item', 'Cart, %d items', $count, 'luciastuy'),
        $count
    );
    ?>
    <a class="site-cart-link" href="<?php echo esc_url(wc_get_cart_url()); ?>" aria-label="<?php echo esc_attr($label); ?>">
        <span class="site-cart-icon" aria-hidden="true"></span>
        <span class="site-cart-count" aria-hidden="true"><?php echo esc_html((string) $count); ?></span>
    </a>
    <?php
}

function luciastuy_cart_fragments(array $fragments): array
{
    ob_start();
    luciastuy_render_cart_link();
    $fragments['a.site-cart-link'] = ob_get_clean();

    return $fragments;
}
add_filter('woocommerce_add_to_cart_fragments', 'luciastuy_cart_fragments');

function luciastuy_logo_asset_url(): string
{
    $relative_path = '/assets/logo-lucia-astuy.png';
    $absolute_path = get_stylesheet_directory() . $relative_path;

    if (! file_exists($absolute_path)) {
        return '';
    }

    return get_stylesheet_directory_uri() . $relative_path;
}

function luciastuy_render_site_branding(): void
{
    $logo_url = luciastuy_logo_asset_url();

    if ($logo_url !== '') {
        ?>
        <a class="site-logo" href="<?php echo esc_url(home_url('/')); ?>" aria-label="<?php echo esc_attr(get_bloginfo('name')); ?>">
            <img src="<?php echo esc_url($logo_url); ?>" alt="<?php echo esc_attr(get_bloginfo('name')); ?>" width="118" height="90">
        </a>
        <?php
        return;
    }
    ?>
    <p class="site-title"><a href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a></p>
    <?php
}

function luciastuy_render_header(): void
{
    $description = get_bloginfo('description');
    ?>
    <!doctype html>
    <html <?php language_attributes(); ?>>
    <head>
        <meta charset="<?php bloginfo('charset'); ?>">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <?php wp_head(); ?>
    </head>
    <body <?php body_class(); ?>>
    <?php wp_body_open(); ?>
    <header class="site-header">
        <div class="site-branding">
            <?php luciastuy_render_site_branding(); ?>
            <?php if ($description !== '') : ?>
                <p class="site-tagline"><?php echo esc_html($description); ?></p>
            <?php endif; ?>
        </div>
        <div class="site-actions">
            <?php
            if (has_nav_menu('primary')) {
                ?>
                <button class="site-menu-toggle" type="button" aria-controls="site-primary-navigation" aria-expanded="false">
                    <span class="site-menu-toggle-label"><?php esc_html_e('Menu', 'luciastuy'); ?></span>
                    <span class="site-menu-toggle-icon" aria-hidden="true"></span>
                </button>
                <?php
                wp_nav_menu([
                    'container' => 'nav',
                    'container_class' => 'primary-navigation',
                    'container_id' => 'site-primary-navigation',
                    'depth' => 1,
                    'menu_class' => 'primary-menu',
                    'menu_id' => 'primary-menu',
                    'theme_location' => 'primary',
                ]);
            }
            luciastuy_render_cart_link();
            ?>
        </div>
    </header>
    <?php
}

function luciastuy_render_footer(): void
{
    ?>
    <footer class="site-footer">
        <p><?php echo esc_html(get_bloginfo('name')); ?></p>
    </footer>
    <?php wp_footer(); ?>
    </body>
    </html>
    <?php
}
