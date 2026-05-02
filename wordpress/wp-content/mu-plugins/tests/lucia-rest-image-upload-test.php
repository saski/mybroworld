<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);

require __DIR__ . '/../lucia-rest-image-upload.php';

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

$tmpImage = tempnam(sys_get_temp_dir(), 'lucia-jpeg-');
if ($tmpImage === false) {
    fwrite(STDERR, 'Could not create temporary image file.' . PHP_EOL);
    exit(1);
}

file_put_contents(
    $tmpImage,
    base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2w==', true),
);

$extensionless = lucia_sideload_image_name_with_extension([
    'name' => '1abc_DEF-234',
    'tmp_name' => $tmpImage,
]);

$alreadyNamed = lucia_sideload_image_name_with_extension([
    'name' => 'already-named.png',
    'tmp_name' => $tmpImage,
]);

@unlink($tmpImage);

assertSameValue('1abc_DEF-234.jpg', $extensionless['name'], 'Extensionless image sideloads should receive a JPEG extension from file MIME.');
assertSameValue('already-named.png', $alreadyNamed['name'], 'Existing image filenames should not be changed.');
