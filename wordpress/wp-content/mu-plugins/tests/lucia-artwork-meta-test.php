<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);

$GLOBALS['lucia_meta_test_updates'] = [];

function update_post_meta(int $postId, string $metaKey, string $metaValue): bool
{
    $GLOBALS['lucia_meta_test_updates'][] = [
        'post_id' => $postId,
        'meta_key' => $metaKey,
        'meta_value' => $metaValue,
    ];

    return true;
}

require __DIR__ . '/../lucia-artwork-meta.php';

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

$metaKeys = lucia_artwork_meta_keys();

assertSameValue('_lucia_current_location', $metaKeys['location_clean'] ?? null, 'Current location key should stay stable.');
assertSameValue('_lucia_location_history', $metaKeys['location_history'] ?? null, 'Location history key should stay stable.');
assertSameValue('_lucia_submission_history', $metaKeys['submission_history'] ?? null, 'Submission history key should stay stable.');

assertSameValue('El Grifo', lucia_sanitize_artwork_text_meta('  El Grifo  '), 'Text meta values should be trimmed.');
assertSameValue(
    'Residencia Escala House 07.01/20.02 -> El Grifo -> Juan Roller',
    lucia_sanitize_artwork_history_meta(' Residencia Escala House 07.01/20.02   ->  El Grifo  ->   Juan Roller '),
    'History meta should normalize spacing around route separators.',
);
assertSameValue(
    'Juan Roller',
    lucia_current_location_from_history('Residencia Escala House 07.01/20.02 -> El Grifo -> Juan Roller'),
    'Current location should come from the last route step.',
);

lucia_update_artwork_location_meta(
    42,
    '  Juan Roller  ',
    ' Residencia Escala House 07.01/20.02   ->  El Grifo  ->   Juan Roller ',
);

assertSameValue(
    [
        [
            'post_id' => 42,
            'meta_key' => '_lucia_current_location',
            'meta_value' => 'Juan Roller',
        ],
        [
            'post_id' => 42,
            'meta_key' => '_lucia_location_history',
            'meta_value' => 'Residencia Escala House 07.01/20.02 -> El Grifo -> Juan Roller',
        ],
    ],
    $GLOBALS['lucia_meta_test_updates'],
    'Location meta writer should persist both current location and route history.',
);
