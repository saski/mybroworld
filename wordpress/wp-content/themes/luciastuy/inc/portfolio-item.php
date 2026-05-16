<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

/**
 * @return list<array{label: string, value: string}>
 */
function luciastuy_portfolio_metadata_rows(int $post_id): array
{
    if (get_post_meta($post_id, 'visible_details', true) !== 'show') {
        return [];
    }

    $pairs = [
        ['author_title', 'author'],
        ['client_name_title', 'client_name'],
        ['project_date_title', 'project_date'],
        ['project_location_title', 'project_location'],
    ];
    $rows = [];

    foreach ($pairs as [$label_key, $value_key]) {
        $label = trim((string) get_post_meta($post_id, $label_key, true));
        $value = trim((string) get_post_meta($post_id, $value_key, true));

        if ($label === '' && $value === '') {
            continue;
        }

        $rows[] = [
            'label' => $label,
            'value' => $value,
        ];
    }

    return $rows;
}

/**
 * @return list<array{id: int, url: string, alt: string}>
 */
function luciastuy_portfolio_gallery_items(int $post_id): array
{
    $raw = get_post_meta($post_id, 'gallery_projects', true);
    $attachment_ids = [];

    if (is_array($raw)) {
        $attachment_ids = array_map('intval', $raw);
    } elseif (is_string($raw) && $raw !== '') {
        $maybe = maybe_unserialize($raw);
        if (is_array($maybe)) {
            $attachment_ids = array_map('intval', $maybe);
        }
    }

    $attachment_ids = array_values(array_filter($attachment_ids));

    if ($attachment_ids === []) {
        $thumbnail_id = (int) get_post_thumbnail_id($post_id);
        if ($thumbnail_id > 0) {
            $attachment_ids = [$thumbnail_id];
        }
    }

    $items = [];

    foreach ($attachment_ids as $attachment_id) {
        $url = wp_get_attachment_image_url($attachment_id, 'full');
        if (! is_string($url) || $url === '') {
            continue;
        }

        $alt = trim((string) get_post_meta($attachment_id, '_wp_attachment_image_alt', true));
        if ($alt === '') {
            $alt = get_the_title($post_id);
        }

        $items[] = [
            'id' => $attachment_id,
            'url' => $url,
            'alt' => $alt,
        ];
    }

    return $items;
}

/**
 * @return list<int>
 */
function luciastuy_portfolio_ordered_ids(): array
{
    $posts = get_posts([
        'fields' => 'ids',
        'orderby' => [
            'menu_order' => 'ASC',
            'date' => 'DESC',
        ],
        'order' => 'ASC',
        'post_status' => 'publish',
        'post_type' => 'portfolio',
        'posts_per_page' => -1,
    ]);

    return array_map('intval', $posts);
}

/**
 * @return array{prev: ?array{url: string, title: string}, next: ?array{url: string, title: string}}
 */
function luciastuy_portfolio_adjacent_links(int $post_id): array
{
    $ordered_ids = luciastuy_portfolio_ordered_ids();
    $index = array_search($post_id, $ordered_ids, true);
    $empty = ['prev' => null, 'next' => null];

    if ($index === false) {
        return $empty;
    }

    $build = static function (int $neighbor_id): ?array {
        if ($neighbor_id <= 0) {
            return null;
        }

        $permalink = get_permalink($neighbor_id);
        if (! is_string($permalink) || $permalink === '') {
            return null;
        }

        return [
            'title' => get_the_title($neighbor_id),
            'url' => $permalink,
        ];
    };

    $prev_id = $ordered_ids[$index - 1] ?? 0;
    $next_id = $ordered_ids[$index + 1] ?? 0;

    return [
        'prev' => $build($prev_id),
        'next' => $build($next_id),
    ];
}
