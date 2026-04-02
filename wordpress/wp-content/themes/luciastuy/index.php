<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

luciastuy_render_header();
?>
<main class="site-main">
    <?php if (have_posts()) : ?>
        <?php while (have_posts()) : the_post(); ?>
            <article <?php post_class(); ?>>
                <h1><?php the_title(); ?></h1>
                <?php the_content(); ?>
            </article>
        <?php endwhile; ?>
    <?php else : ?>
        <article>
            <h1><?php esc_html_e('Content coming soon', 'luciastuy'); ?></h1>
            <p><?php esc_html_e('This owned theme is the clean baseline for the WordPress rebuild.', 'luciastuy'); ?></p>
        </article>
    <?php endif; ?>
</main>
<?php
luciastuy_render_footer();
