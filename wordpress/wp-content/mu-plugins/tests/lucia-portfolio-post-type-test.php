<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);

$GLOBALS['lucia_portfolio_test_updates'] = [];
$GLOBALS['lucia_portfolio_test_metas'] = [];

function update_post_meta(int $postId, string $metaKey, string $metaValue): bool
{
    $GLOBALS['lucia_portfolio_test_updates'][] = [
        'post_id' => $postId,
        'meta_key' => $metaKey,
        'meta_value' => $metaValue,
    ];

    return true;
}

function get_post_meta(int $postId, string $key, bool $single)
{
    return $GLOBALS['lucia_portfolio_test_metas'][$postId][$key] ?? '';
}

function sanitize_text_field(string $value): string
{
    return trim(strip_tags($value));
}

function wp_unslash(string $value): string
{
    return stripslashes($value);
}

function current_user_can(string $capability): bool
{
    return true;
}

function get_post_type(int $postId): string
{
    return 'portfolio';
}

function __(string $text, string $domain = 'default'): string
{
    return $text;
}

require __DIR__ . '/../lucia-portfolio-post-type.php';

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

function assertTrue(bool $condition, string $message): void
{
    if ($condition) {
        return;
    }

    fwrite(STDERR, $message . PHP_EOL);
    exit(1);
}

assertSameValue('portfolio', lucia_portfolio_post_type_key(), 'Post type key should be portfolio.');

$args = lucia_portfolio_post_type_args();
assertTrue($args['public'], 'Portfolio post type should be public.');
assertTrue($args['has_archive'] === false, 'Portfolio post type should not have an archive.');
assertSameValue('portfolio', $args['rewrite']['slug'] ?? '', 'Rewrite slug should be portfolio.');
assertTrue($args['show_in_rest'], 'Portfolio post type should show in REST.');
assertTrue(in_array('title', $args['supports'], true), 'Portfolio should support title.');
assertTrue(in_array('editor', $args['supports'], true), 'Portfolio should support editor.');
assertTrue(in_array('thumbnail', $args['supports'], true), 'Portfolio should support thumbnail.');
assertTrue(in_array('page-attributes', $args['supports'], true), 'Portfolio should support page-attributes for menu order.');
assertTrue(in_array('custom-fields', $args['supports'], true), 'Portfolio should support custom-fields.');

$expectedMetaKeys = [
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

assertSameValue($expectedMetaKeys, lucia_portfolio_meta_keys(), 'Meta keys should cover all fields used by the owned theme.');

$stringConfig = lucia_portfolio_meta_config('author');
assertSameValue('string', $stringConfig['type'], 'Text meta should be string type.');
assertTrue($stringConfig['single'], 'Text meta should be single.');
assertTrue($stringConfig['show_in_rest'], 'Text meta should show in REST.');

$galleryConfig = lucia_portfolio_meta_config('gallery_projects');
assertSameValue('lucia_portfolio_sanitize_gallery_meta', $galleryConfig['sanitize_callback'], 'Gallery meta should use custom sanitizer.');

assertSameValue('', lucia_portfolio_sanitize_gallery_meta(''), 'Empty gallery input should return empty string.');
assertSameValue('', lucia_portfolio_sanitize_gallery_meta('  '), 'Whitespace-only gallery input should return empty string.');
assertSameValue('2379,2380,2381', lucia_portfolio_sanitize_gallery_meta('2379, 2380, 2381'), 'Gallery should normalize comma-separated IDs.');
assertSameValue('2379,2380,2381', lucia_portfolio_sanitize_gallery_meta(' 2379 , 2380 , 2381 '), 'Gallery should trim whitespace around IDs.');
assertSameValue('2379,2380,2381', lucia_portfolio_sanitize_gallery_meta([2379, 2380, 2381]), 'Gallery should accept array input.');
assertSameValue('2379,2380', lucia_portfolio_sanitize_gallery_meta('2379,0,2380,0'), 'Gallery should filter zero IDs.');
assertSameValue('2379,2380', lucia_portfolio_sanitize_gallery_meta('2379,2380,2379'), 'Gallery should deduplicate IDs.');

$fields = lucia_portfolio_meta_box_fields();
assertSameValue(10, count($fields), 'Meta box should have 10 fields.');
assertTrue(isset($fields['visible_details']), 'Meta box should include visible_details.');
assertTrue(isset($fields['gallery_projects']), 'Meta box should include gallery_projects.');
assertSameValue('select', $fields['visible_details']['type'], 'visible_details should be a select field.');
assertSameValue('gallery', $fields['gallery_projects']['type'], 'gallery_projects should be a gallery field.');
assertTrue($fields['visible_details']['options']['show'] === __('Visible', 'luciastuy'), 'visible_details should have show option.');

$GLOBALS['lucia_portfolio_test_metas'][42] = [
    'visible_details' => 'show',
    'author_title' => 'Págs',
    'author' => '20',
    'gallery_projects' => '2379,2380,2381',
];

assertSameValue('show', lucia_portfolio_get_meta(42, 'visible_details'), 'get_meta should return stored value.');
assertSameValue('Págs', lucia_portfolio_get_meta(42, 'author_title'), 'get_meta should return stored text.');
assertSameValue('2379,2380,2381', lucia_portfolio_get_meta(42, 'gallery_projects'), 'get_meta should normalize gallery value.');

$GLOBALS['lucia_portfolio_test_metas'][43] = [
    'gallery_projects' => [2379, 2380, 2381],
];

assertSameValue('2379,2380,2381', lucia_portfolio_get_meta(43, 'gallery_projects'), 'get_meta should normalize array gallery from DB.');

assertSameValue([], $GLOBALS['lucia_portfolio_test_updates'], 'No meta updates should happen before save_meta.');

$_POST['lucia_portfolio_nonce'] = 'invalid';
lucia_portfolio_save_meta(42);
assertSameValue([], $GLOBALS['lucia_portfolio_test_updates'], 'save_meta should reject invalid nonce.');

$GLOBALS['lucia_portfolio_test_updates'] = [];

echo "All lucia-portfolio-post-type tests passed.\n";
