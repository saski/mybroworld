<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function luciastuy_theme_setup(): void
{
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
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
    $theme = wp_get_theme();

    wp_enqueue_style(
        'luciastuy-style',
        get_stylesheet_uri(),
        [],
        $theme->get('Version')
    );
}
add_action('wp_enqueue_scripts', 'luciastuy_enqueue_assets');

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
        <p class="site-title"><a href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a></p>
        <?php if ($description !== '') : ?>
            <p class="site-tagline"><?php echo esc_html($description); ?></p>
        <?php endif; ?>
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
