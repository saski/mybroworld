export const HELPER_SHEET_TITLES = new Set([
  'catalog_jobs',
  'catalog_profiles',
  'validation_lists',
  'nvscriptsproperties',
]);

export const REQUIRED_COMPATIBILITY_HEADERS = [
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

export const PROFILE_HEADERS = [
  'profile_key',
  'label',
  'enabled',
  'google_account_email',
  'macos_user_hint',
  'default_drive_folder_id',
  'notes',
];

export const JOB_HEADERS = [
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

export const DEFAULT_ARTIST_NAME = 'Lucía Astuy';

export const REVIEW_STATUS_VALUES = ['approved', 'needs_changes'];

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeToken(value) {
  return normalizeText(value).toLowerCase().replace(/[-\s]+/g, '_');
}

export function normalizeHeader(value) {
  return normalizeText(value).toLowerCase();
}

export function getMissingRequiredHeaders(headers = []) {
  const normalizedHeaders = new Set(headers.map(normalizeHeader).filter(Boolean));
  return REQUIRED_COMPATIBILITY_HEADERS.filter((header) => !normalizedHeaders.has(header));
}

export function looksLikeYearTitle(title) {
  return /^\d{4}$/.test(normalizeText(title));
}

export function getCompatibleTabs({ activeSheetId, tabs = [] }) {
  const compatibleTabs = tabs
    .filter((tab) => !tab.hidden)
    .filter((tab) => !HELPER_SHEET_TITLES.has(normalizeHeader(tab.title)))
    .map((tab) => ({
      sheetId: Number(tab.sheetId),
      title: normalizeText(tab.title),
      missingRequiredHeaders: getMissingRequiredHeaders(tab.headers || []),
    }))
    .filter((tab) => tab.sheetId > 0 && !Number.isNaN(tab.sheetId))
    .filter((tab) => tab.missingRequiredHeaders.length === 0);

  return compatibleTabs.sort((left, right) => {
    const leftIsActive = left.sheetId === activeSheetId ? 1 : 0;
    const rightIsActive = right.sheetId === activeSheetId ? 1 : 0;
    if (leftIsActive !== rightIsActive) {
      return rightIsActive - leftIsActive;
    }

    const leftIsYear = looksLikeYearTitle(left.title) ? 1 : 0;
    const rightIsYear = looksLikeYearTitle(right.title) ? 1 : 0;
    if (leftIsYear !== rightIsYear) {
      return rightIsYear - leftIsYear;
    }

    if (leftIsYear && rightIsYear) {
      return right.title.localeCompare(left.title);
    }

    return left.title.localeCompare(right.title);
  });
}

export function resolveJobSheetSelection({
  activeSheetId,
  compatibleTabs,
  scopeMode,
  selectedSheetIds = [],
}) {
  const tabs = compatibleTabs || [];
  const tabsById = new Map(tabs.map((tab) => [tab.sheetId, tab]));

  if (scopeMode === 'current_tab') {
    const activeTab = tabsById.get(activeSheetId);
    if (!activeTab) {
      throw new Error('The active tab is not compatible.');
    }
    return [activeTab];
  }

  if (scopeMode === 'selected_tabs') {
    const normalizedIds = selectedSheetIds
      .map((sheetId) => Number(sheetId))
      .filter((sheetId) => !Number.isNaN(sheetId));
    const selectedTabs = normalizedIds.map((sheetId) => tabsById.get(sheetId)).filter(Boolean);
    if (selectedTabs.length !== normalizedIds.length || selectedTabs.length === 0) {
      throw new Error('Selected tabs must be compatible.');
    }
    return selectedTabs;
  }

  if (scopeMode === 'all_compatible_tabs') {
    if (tabs.length === 0) {
      throw new Error('No compatible tabs are available.');
    }
    return [...tabs];
  }

  throw new Error(`Unsupported scope mode: ${scopeMode}`);
}

function normalizeFilenameStem(value) {
  return normalizeText(value)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function compactTimestamp(timestampIso) {
  const date = new Date(timestampIso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${timestampIso}`);
  }

  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export function sanitizeOutputFilename({ catalogTitle, timestampIso }) {
  const stem = normalizeFilenameStem(catalogTitle) || 'catalog';
  return `${stem}-${compactTimestamp(timestampIso)}.pdf`;
}

export function buildJobId({ createdAtIso, randomSuffix }) {
  const suffix = normalizeFilenameStem(randomSuffix).replace(/-/g, '') || 'job';
  return `catalog_${compactTimestamp(createdAtIso)}_${suffix}`;
}

export function resolveOutputFolderId({ explicitOutputFolderId, profileDefaultFolderId }) {
  const resolvedFolderId = normalizeText(explicitOutputFolderId) || normalizeText(profileDefaultFolderId);
  if (!resolvedFolderId) {
    throw new Error('An output folder is required before queueing a job.');
  }
  return resolvedFolderId;
}

export function buildCatalogReviewRecord({
  reviewNotes = '',
  reviewStatus,
  reviewedAtIso,
  reviewedBy = '',
}) {
  const normalizedReviewStatus = normalizeToken(reviewStatus);
  if (!REVIEW_STATUS_VALUES.includes(normalizedReviewStatus)) {
    throw new Error('Review status must be approved or needs_changes.');
  }

  const reviewedAt = normalizeText(reviewedAtIso);
  if (Number.isNaN(new Date(reviewedAt).getTime())) {
    throw new Error(`Invalid review timestamp: ${reviewedAtIso}`);
  }

  return {
    review_notes: normalizeText(reviewNotes),
    review_status: normalizedReviewStatus,
    reviewed_at: reviewedAt,
    reviewed_by: normalizeText(reviewedBy),
  };
}

export function buildQueuedJobRecord({
  activeSheetId,
  artistName = '',
  catalogTitle,
  compatibleTabs,
  createdAtIso,
  createdByEmail = '',
  createdByUserKey = '',
  executionProfile,
  outputFilename = '',
  outputFolderId = '',
  randomSuffix,
  scopeMode,
  selectedSheetIds = [],
}) {
  const selectedTabs = resolveJobSheetSelection({
    activeSheetId,
    compatibleTabs,
    scopeMode,
    selectedSheetIds,
  });

  const resolvedOutputFolderId = resolveOutputFolderId({
    explicitOutputFolderId: outputFolderId,
    profileDefaultFolderId: executionProfile?.defaultDriveFolderId,
  });

  const resolvedArtistName = normalizeText(artistName) || DEFAULT_ARTIST_NAME;
  const resolvedCatalogTitle = normalizeText(catalogTitle);
  if (!resolvedCatalogTitle) {
    throw new Error('A catalog title is required before queueing a job.');
  }

  return {
    artist_name: resolvedArtistName,
    catalog_title: resolvedCatalogTitle,
    created_at: createdAtIso,
    created_by_email: normalizeText(createdByEmail),
    created_by_user_key: normalizeText(createdByUserKey),
    execution_profile: normalizeText(executionProfile?.profileKey),
    job_id: buildJobId({ createdAtIso, randomSuffix }),
    output_filename: normalizeText(outputFilename) || sanitizeOutputFilename({
      catalogTitle: resolvedCatalogTitle,
      timestampIso: createdAtIso,
    }),
    output_folder_id: resolvedOutputFolderId,
    review_notes: '',
    review_status: '',
    reviewed_at: '',
    reviewed_by: '',
    scope_mode: scopeMode,
    sheet_ids_json: JSON.stringify(selectedTabs.map((tab) => tab.sheetId)),
    sheet_titles_json: JSON.stringify(selectedTabs.map((tab) => tab.title)),
    status: 'queued',
  };
}
