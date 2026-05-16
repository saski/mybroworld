<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

luciastuy_render_header();
?>
<main class="site-main luciastuy-portfolio-item">
    <?php
    while (have_posts()) :
        the_post();
        $post_id = get_the_ID();
        $gallery_items = luciastuy_portfolio_gallery_items($post_id);
        $metadata_rows = luciastuy_portfolio_metadata_rows($post_id);
        $adjacent_links = luciastuy_portfolio_adjacent_links($post_id);
        $description = apply_filters('the_content', get_the_content());
        $has_description = trim(wp_strip_all_tags($description)) !== '';
        ?>
        <article <?php post_class('luciastuy-portfolio-item__article'); ?>>
            <div class="luciastuy-portfolio-item__info">
                <h4 class="luciastuy-portfolio-item__title"><?php the_title(); ?></h4>

                <?php if ($has_description) : ?>
                    <div class="luciastuy-portfolio-item__description">
                        <?php echo $description; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                    </div>
                <?php endif; ?>

                <?php if ($metadata_rows !== []) : ?>
                    <div class="luciastuy-portfolio-item__details">
                        <?php foreach ($metadata_rows as $row) : ?>
                            <div class="luciastuy-portfolio-item__detail">
                                <?php if ($row['label'] !== '') : ?>
                                    <h5 class="luciastuy-portfolio-item__detail-label"><?php echo esc_html($row['label']); ?></h5>
                                <?php endif; ?>
                                <?php if ($row['value'] !== '') : ?>
                                    <p class="luciastuy-portfolio-item__detail-value"><?php echo esc_html($row['value']); ?></p>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <?php if ($gallery_items !== []) : ?>
                <div class="luciastuy-portfolio-item__media" data-portfolio-gallery>
                    <h2 class="screen-reader-text"><?php esc_html_e('Project images', 'luciastuy'); ?></h2>
                    <ul class="luciastuy-portfolio-item__gallery">
                        <?php foreach ($gallery_items as $item) : ?>
                            <li class="luciastuy-portfolio-item__gallery-item">
                                <button
                                    class="luciastuy-portfolio-item__gallery-trigger"
                                    type="button"
                                    data-portfolio-image-trigger
                                    data-full-url="<?php echo esc_url($item['url']); ?>"
                                    data-image-alt="<?php echo esc_attr($item['alt']); ?>"
                                    aria-haspopup="dialog"
                                >
                                    <img
                                        src="<?php echo esc_url($item['url']); ?>"
                                        alt="<?php echo esc_attr($item['alt']); ?>"
                                        loading="lazy"
                                        decoding="async"
                                    >
                                </button>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
        </article>

        <?php if ($adjacent_links['prev'] !== null || $adjacent_links['next'] !== null) : ?>
            <nav class="luciastuy-portfolio-item__nav" aria-label="<?php esc_attr_e('Portfolio projects', 'luciastuy'); ?>">
                <div class="luciastuy-portfolio-item__nav-inner">
                    <?php if ($adjacent_links['prev'] !== null) : ?>
                        <div class="luciastuy-portfolio-item__nav-prev">
                            <a class="luciastuy-portfolio-item__nav-link" rel="prev" href="<?php echo esc_url($adjacent_links['prev']['url']); ?>">
                                <span class="luciastuy-portfolio-item__nav-icon" aria-hidden="true">&lsaquo;</span>
                                <span><?php esc_html_e('Prev project', 'luciastuy'); ?></span>
                            </a>
                        </div>
                    <?php endif; ?>

                    <?php if ($adjacent_links['next'] !== null) : ?>
                        <div class="luciastuy-portfolio-item__nav-next">
                            <a class="luciastuy-portfolio-item__nav-link" rel="next" href="<?php echo esc_url($adjacent_links['next']['url']); ?>">
                                <span><?php esc_html_e('Next project', 'luciastuy'); ?></span>
                                <span class="luciastuy-portfolio-item__nav-icon" aria-hidden="true">&rsaquo;</span>
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
            </nav>
        <?php endif; ?>
    <?php endwhile; ?>

    <div class="luciastuy-portfolio-lightbox" data-portfolio-lightbox hidden>
        <div class="luciastuy-portfolio-lightbox__backdrop" data-portfolio-lightbox-close></div>
        <div class="luciastuy-portfolio-lightbox__panel" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e('Expanded project image', 'luciastuy'); ?>">
            <button class="luciastuy-portfolio-lightbox__close" type="button" data-portfolio-lightbox-close>
                <?php esc_html_e('Close', 'luciastuy'); ?>
            </button>
            <img class="luciastuy-portfolio-lightbox__image" data-portfolio-lightbox-image alt="">
        </div>
    </div>
</main>
<?php
luciastuy_render_footer();
