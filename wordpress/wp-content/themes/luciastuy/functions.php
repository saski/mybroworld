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
            <p class="site-title"><a href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a></p>
            <?php if ($description !== '') : ?>
                <p class="site-tagline"><?php echo esc_html($description); ?></p>
            <?php endif; ?>
        </div>
        <?php
        if (has_nav_menu('primary')) {
            wp_nav_menu([
                'container' => 'nav',
                'container_class' => 'primary-navigation',
                'depth' => 1,
                'menu_class' => 'primary-menu',
                'menu_id' => 'primary-menu',
                'theme_location' => 'primary',
            ]);
        }
        ?>
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
