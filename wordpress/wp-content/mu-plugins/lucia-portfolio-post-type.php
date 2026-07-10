<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function lucia_portfolio_post_type_key(): string
{
    return 'portfolio';
}

function lucia_portfolio_post_type_args(): array
{
    return [
        'labels' => [
            'name' => __('Portfolio', 'luciastuy'),
            'singular_name' => __('Project', 'luciastuy'),
            'add_new' => __('Add New', 'luciastuy'),
            'add_new_item' => __('Add New Project', 'luciastuy'),
            'edit_item' => __('Edit Project', 'luciastuy'),
            'new_item' => __('New Project', 'luciastuy'),
            'view_item' => __('View Project', 'luciastuy'),
            'search_items' => __('Search Portfolio', 'luciastuy'),
            'not_found' => __('No projects found.', 'luciastuy'),
            'not_found_in_trash' => __('No projects found in trash.', 'luciastuy'),
            'all_items' => __('All Projects', 'luciastuy'),
            'menu_name' => __('Portfolio', 'luciastuy'),
        ],
        'public' => true,
        'has_archive' => false,
        'rewrite' => [
            'slug' => 'portfolio',
            'with_front' => false,
        ],
        'show_in_rest' => true,
        'menu_icon' => 'dashicons-portfolio',
        'menu_position' => 20,
        'supports' => [
            'title',
            'editor',
            'thumbnail',
            'page-attributes',
            'custom-fields',
        ],
    ];
}

function lucia_portfolio_register_post_type(): void
{
    if (! function_exists('register_post_type')) {
        return;
    }

    register_post_type(
        lucia_portfolio_post_type_key(),
        lucia_portfolio_post_type_args(),
    );
}

function lucia_portfolio_meta_keys(): array
{
    return [
        'visible_details',
        'author_title',
        'author',
        'client_name_title',
        'client_name',
        'project_date_title',
        'project_date',
        'project_location_title',
        'project_location',
        'gallery_projects',
    ];
}

function lucia_portfolio_meta_config(string $key): array
{
    $stringMeta = [
        'type' => 'string',
        'single' => true,
        'default' => '',
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_text_field',
        'auth_callback' => static function (): bool {
            return current_user_can('edit_posts');
        },
    ];

    $galleryConfig = $stringMeta;
    $galleryConfig['sanitize_callback'] = 'lucia_portfolio_sanitize_gallery_meta';

    return $key === 'gallery_projects' ? $galleryConfig : $stringMeta;
}

function lucia_portfolio_sanitize_gallery_meta(mixed $value): string
{
    if (is_array($value)) {
        $ids = array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0);
        return implode(',', $ids);
    }

    $text = trim((string) $value);
    if ($text === '') {
        return '';
    }

    $parts = array_filter(array_map('trim', explode(',', $text)), static fn (string $part): bool => $part !== '');
    $ids = array_filter(array_map('intval', $parts), static fn (int $id): bool => $id > 0);

    return implode(',', array_values(array_unique($ids)));
}

function lucia_portfolio_register_meta(): void
{
    if (! function_exists('register_post_meta')) {
        return;
    }

    foreach (lucia_portfolio_meta_keys() as $key) {
        register_post_meta(
            lucia_portfolio_post_type_key(),
            $key,
            lucia_portfolio_meta_config($key),
        );
    }
}

function lucia_portfolio_meta_box_id(): string
{
    return 'lucia_portfolio_details';
}

function lucia_portfolio_add_meta_box(): void
{
    if (! function_exists('add_meta_box')) {
        return;
    }

    add_meta_box(
        lucia_portfolio_meta_box_id(),
        __('Portfolio Details', 'luciastuy'),
        'lucia_portfolio_render_meta_box',
        lucia_portfolio_post_type_key(),
        'normal',
        'default',
    );
}

function lucia_portfolio_meta_box_fields(): array
{
    return [
        'visible_details' => [
            'label' => __('Show details panel', 'luciastuy'),
            'type' => 'select',
            'options' => [
                '' => __('Hidden', 'luciastuy'),
                'show' => __('Visible', 'luciastuy'),
            ],
        ],
        'author_title' => [
            'label' => __('Author label', 'luciastuy'),
            'type' => 'text',
        ],
        'author' => [
            'label' => __('Author value', 'luciastuy'),
            'type' => 'text',
        ],
        'client_name_title' => [
            'label' => __('Client label', 'luciastuy'),
            'type' => 'text',
        ],
        'client_name' => [
            'label' => __('Client value', 'luciastuy'),
            'type' => 'text',
        ],
        'project_date_title' => [
            'label' => __('Date label', 'luciastuy'),
            'type' => 'text',
        ],
        'project_date' => [
            'label' => __('Date value', 'luciastuy'),
            'type' => 'text',
        ],
        'project_location_title' => [
            'label' => __('Location label', 'luciastuy'),
            'type' => 'text',
        ],
        'project_location' => [
            'label' => __('Location value', 'luciastuy'),
            'type' => 'text',
        ],
        'gallery_projects' => [
            'label' => __('Gallery image IDs (comma-separated)', 'luciastuy'),
            'type' => 'gallery',
        ],
    ];
}

function lucia_portfolio_get_meta(int $postId, string $key): string
{
    $raw = get_post_meta($postId, $key, true);

    if ($key === 'gallery_projects') {
        return lucia_portfolio_sanitize_gallery_meta($raw);
    }

    return trim((string) $raw);
}

function lucia_portfolio_render_meta_box(WP_Post $post): void
{
    wp_nonce_field('lucia_portfolio_meta', 'lucia_portfolio_nonce');

    $fields = lucia_portfolio_meta_box_fields();

    echo '<table class="form-table" role="presentation"><tbody>';

    foreach ($fields as $key => $config) {
        $value = lucia_portfolio_get_meta((int) $post->ID, $key);
        $fieldId = 'lucia_portfolio_' . $key;
        $fieldName = 'lucia_portfolio_' . $key;

        echo '<tr>';
        echo '<th scope="row"><label for="' . esc_attr($fieldId) . '">' . esc_html($config['label']) . '</label></th>';
        echo '<td>';

        if ($config['type'] === 'select') {
            echo '<select id="' . esc_attr($fieldId) . '" name="' . esc_attr($fieldName) . '">';
            foreach ($config['options'] as $optionValue => $optionLabel) {
                $selected = $optionValue === $value ? ' selected' : '';
                echo '<option value="' . esc_attr($optionValue) . '"' . $selected . '>' . esc_html($optionLabel) . '</option>';
            }
            echo '</select>';
        } elseif ($config['type'] === 'gallery') {
            echo '<input type="text" class="large-text" id="' . esc_attr($fieldId) . '" name="' . esc_attr($fieldName) . '" value="' . esc_attr($value) . '" placeholder="e.g. 2379,2380,2381">';
            echo '<p class="description">' . esc_html__('Enter attachment IDs separated by commas. Use the Media Library to find IDs.', 'luciastuy') . '</p>';
        } else {
            echo '<input type="text" class="regular-text" id="' . esc_attr($fieldId) . '" name="' . esc_attr($fieldName) . '" value="' . esc_attr($value) . '">';
        }

        echo '</td>';
        echo '</tr>';
    }

    echo '</tbody></table>';
}

function lucia_portfolio_meta_box_field_keys(): array
{
    return array_keys(lucia_portfolio_meta_box_fields());
}

function lucia_portfolio_save_meta(int $postId): void
{
    if (! isset($_POST['lucia_portfolio_nonce'])) {
        return;
    }

    $nonce = (string) $_POST['lucia_portfolio_nonce'];
    if (! function_exists('wp_verify_nonce') || ! wp_verify_nonce($nonce, 'lucia_portfolio_meta')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    $postType = function_exists('get_post_type') ? get_post_type($postId) : '';
    if ($postType !== lucia_portfolio_post_type_key()) {
        return;
    }

    if (! function_exists('current_user_can') || ! current_user_can('edit_post', $postId)) {
        return;
    }

    foreach (lucia_portfolio_meta_box_field_keys() as $key) {
        $fieldName = 'lucia_portfolio_' . $key;
        if (! isset($_POST[$fieldName])) {
            continue;
        }

        $rawValue = $_POST[$fieldName];

        if ($key === 'gallery_projects') {
            $sanitized = lucia_portfolio_sanitize_gallery_meta($rawValue);
        } else {
            $sanitized = function_exists('sanitize_text_field')
                ? sanitize_text_field(wp_unslash($rawValue))
                : trim(strip_tags((string) $rawValue));
        }

        update_post_meta($postId, $key, $sanitized);
    }
}

function lucia_portfolio_register_hooks(): void
{
    if (! function_exists('add_action')) {
        return;
    }

    add_action('init', 'lucia_portfolio_register_post_type');
    add_action('init', 'lucia_portfolio_register_meta');
    add_action('add_meta_boxes', 'lucia_portfolio_add_meta_box');
    add_action('save_post', 'lucia_portfolio_save_meta');
}

lucia_portfolio_register_hooks();
