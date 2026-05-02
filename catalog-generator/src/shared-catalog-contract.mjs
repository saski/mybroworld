export const CATALOG_DEFAULT_ARTIST_NAME = 'Lucía Astuy';

export const CATALOG_HELPER_SHEET_TITLES = [
  'catalog_jobs',
  'catalog_profiles',
  'validation_lists',
  'nvscriptsproperties',
];

export const CATALOG_REQUIRED_HEADERS = [
  'artwork_id',
  'title_clean',
  'year',
  'medium_clean',
  'support_clean',
  'dimensions_clean',
  'status_normalized',
  'image_main',
  'include_in_catalog',
  'catalog_ready',
];

export const CATALOG_PROFILE_HEADERS = [
  'profile_key',
  'label',
  'enabled',
  'google_account_email',
  'macos_user_hint',
  'default_drive_folder_id',
  'notes',
];

export const CATALOG_JOB_HEADERS = [
  'job_id',
  'created_at',
  'created_by_email',
  'created_by_user_key',
  'execution_profile',
  'scope_mode',
  'sheet_ids_json',
  'sheet_titles_json',
  'catalog_title',
  'artist_name',
  'output_folder_id',
  'output_filename',
  'status',
  'claim_token',
  'claimed_at',
  'claimed_by_profile',
  'claimed_by_host',
  'claimed_by_user',
  'heartbeat_at',
  'started_at',
  'completed_at',
  'result_file_id',
  'result_file_url',
  'result_local_path',
  'result_artwork_count',
  'error_code',
  'error_message',
  'log_excerpt',
  'review_status',
  'reviewed_at',
  'reviewed_by',
  'review_notes',
];

export const CATALOG_REVIEW_STATUS_VALUES = ['approved', 'needs_changes'];

export const CATALOG_STATUS_ALIASES = {
  available: ['available', 'for_sale', 'disponible'],
  gifted: ['gifted', 'gift', 'regalo', 'donated', 'donation'],
  exchanged: ['exchanged', 'exchange', 'intercambio', 'traded'],
  sold: ['sold', 'vendido'],
  commissioned: ['commissioned', 'commission', 'encargo'],
  reserved: ['reserved', 'reservado', 'reservada'],
  not_for_sale: ['not_for_sale', 'nfs', 'no_disponible'],
  personal_collection: ['personal_collection', 'collection', 'coleccion_personal'],
  archived: ['archived', 'archive', 'archivada'],
};

export const CATALOG_STATUS_LABELS = {
  gifted: 'Obra histórica',
  exchanged: 'Obra histórica',
  personal_collection: 'Obra histórica',
  archived: 'Obra histórica',
  reserved: 'Reservada',
  sold: 'Obra no disponible',
  commissioned: 'Obra no disponible',
  not_for_sale: 'Obra no disponible',
};

export function normalizeCatalogStatus(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');

  for (const [status, aliases] of Object.entries(CATALOG_STATUS_ALIASES)) {
    if (aliases.includes(normalized)) {
      return status;
    }
  }

  return '';
}

export function catalogStatusLabel(value) {
  return CATALOG_STATUS_LABELS[normalizeCatalogStatus(value)] || '';
}
