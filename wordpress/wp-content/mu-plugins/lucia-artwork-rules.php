<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function lucia_normalize_artwork_status(string $status): string
{
    $normalized = strtolower(trim($status));
    $normalized = str_replace(['-', ' '], '_', $normalized);

    return match ($normalized) {
        'available', 'for_sale', 'disponible' => 'available',
        'gifted', 'gift', 'regalo', 'donated', 'donation' => 'gifted',
        'exchanged', 'exchange', 'intercambio', 'traded' => 'exchanged',
        'sold', 'vendido' => 'sold',
        'commissioned', 'commission', 'encargo' => 'commissioned',
        'reserved', 'reservado', 'reservada' => 'reserved',
        'not_for_sale', 'nfs', 'no_disponible' => 'not_for_sale',
        'personal_collection', 'collection', 'coleccion_personal' => 'personal_collection',
        'archived', 'archive', 'archivada' => 'archived',
        default => '',
    };
}

function lucia_artwork_status_label(string $status): string
{
    return match (lucia_normalize_artwork_status($status)) {
        'gifted', 'exchanged', 'personal_collection', 'archived' => 'Obra histórica',
        'reserved' => 'Reservada',
        'sold', 'commissioned', 'not_for_sale' => 'Obra no disponible',
        default => '',
    };
}
