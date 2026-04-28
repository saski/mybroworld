<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);

require __DIR__ . '/../lucia-artwork-rules.php';

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

assertSameValue('reserved', lucia_normalize_artwork_status('reserved'), 'Reserved status should normalize.');
assertSameValue('reserved', lucia_normalize_artwork_status('reservado'), 'Reserved Spanish masculine alias should normalize.');
assertSameValue('reserved', lucia_normalize_artwork_status('reservada'), 'Reserved Spanish feminine alias should normalize.');
assertSameValue('Reservada', lucia_artwork_status_label('reserved'), 'Reserved status should use the catalog label.');
