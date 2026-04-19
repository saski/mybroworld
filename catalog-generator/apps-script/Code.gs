const CATALOG_MENU_TITLE = 'Catalogs';
const CATALOG_SIDEBAR_TITLE = 'Generate Catalog PDF';
const CATALOG_DEFAULT_ARTIST = 'Lucía Astuy';
const CATALOG_REQUIRED_HEADERS = [
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
const CATALOG_HELPER_TITLES = ['catalog_jobs', 'catalog_profiles', 'validation_lists', 'nvscriptsproperties'];
const CATALOG_PROFILE_HEADERS = [
  'profile_key',
  'label',
  'enabled',
  'google_account_email',
  'macos_user_hint',
  'default_drive_folder_id',
  'notes',
];
const CATALOG_JOB_HEADERS = [
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
];
const CATALOG_INITIAL_PROFILES = [
  ['lucia-mybrocorp', 'Lucia / mybrocorp', true, 'mybrocorp@gmail.com', 'luciaastuy', '', 'Production operator'],
  ['nacho-saski', 'Nacho / saski', true, 'nacho.saski@gmail.com', 'nacho', '', 'Development and testing'],
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(CATALOG_MENU_TITLE)
    .addItem('Generate Catalog PDF', 'openCatalogSidebar')
    .addItem('View Catalog Jobs', 'showCatalogJobsSheet')
    .addItem('Refresh Catalog Metadata', 'refreshCatalogMetadata')
    .addSeparator()
    .addItem('Admin: Setup Catalog Infrastructure', 'setupCatalogInfrastructure')
    .addToUi();
}

function openCatalogSidebar() {
  showCatalogSidebar_({
    scopeMode: 'current_tab',
  });
}

function openCatalogSidebarForActiveTab() {
  showCatalogSidebar_({
    preselectedSheetIds: [SpreadsheetApp.getActiveSheet().getSheetId()],
    scopeMode: 'current_tab',
  });
}

function showCatalogJobsSheet() {
  const jobsSheet = ensureCatalogSheet_('catalog_jobs', CATALOG_JOB_HEADERS);
  jobsSheet.showSheet();
  SpreadsheetApp.getActive().setActiveSheet(jobsSheet);
}

function refreshCatalogMetadata() {
  SpreadsheetApp.getActive().toast('Catalog metadata refreshed.', CATALOG_MENU_TITLE, 3);
}

function setupCatalogInfrastructure() {
  const profilesSheet = ensureCatalogSheet_('catalog_profiles', CATALOG_PROFILE_HEADERS);
  const jobsSheet = ensureCatalogSheet_('catalog_jobs', CATALOG_JOB_HEADERS);

  seedCatalogProfiles_(profilesSheet);
  profilesSheet.hideSheet();
  jobsSheet.hideSheet();

  SpreadsheetApp.getActive().toast('Catalog infrastructure is ready.', CATALOG_MENU_TITLE, 5);
}

function getCatalogSidebarModel(prefill) {
  return buildCatalogSidebarModel_(prefill || {});
}

function queueCatalogJob(formData) {
  const payload = formData || {};
  const scopeMode = normalizeCatalogText_(payload.scopeMode) || 'current_tab';
  const spreadsheet = SpreadsheetApp.getActive();
  const profilesSheet = spreadsheet.getSheetByName('catalog_profiles');
  const jobsSheet = spreadsheet.getSheetByName('catalog_jobs');

  if (!profilesSheet || !jobsSheet) {
    throw new Error('Run "Admin: Setup Catalog Infrastructure" before queueing jobs.');
  }

  const sidebarModel = buildCatalogSidebarModel_({
    preselectedProfileKey: payload.executionProfileKey || '',
    preselectedSheetIds: payload.selectedSheetIds || [],
    scopeMode: scopeMode,
  });
  const executionProfile = sidebarModel.profiles.find((profile) => profile.profileKey === payload.executionProfileKey);

  if (!executionProfile) {
    throw new Error('Select an enabled execution profile.');
  }

  const selection = resolveSheetSelection_({
    activeSheetId: sidebarModel.activeSheetId,
    compatibleTabs: sidebarModel.compatibleTabs,
    scopeMode: scopeMode,
    selectedSheetIds: payload.selectedSheetIds || [],
  });

  const createdAtIso = new Date().toISOString();
  const outputFolderId = normalizeCatalogText_(payload.outputFolderId) || executionProfile.defaultDriveFolderId;
  if (!outputFolderId) {
    throw new Error('An output folder is required before queueing a job.');
  }

  const catalogTitle = normalizeCatalogText_(payload.catalogTitle);
  if (!catalogTitle) {
    throw new Error('Enter a catalog title before queueing a job.');
  }

  const outputFilename = sanitizeCatalogOutputFilename_({
    catalogTitle: catalogTitle,
    outputFilename: payload.outputFilename,
    timestampIso: createdAtIso,
  });

  const jobRecord = {
    artist_name: normalizeCatalogText_(payload.artistName) || CATALOG_DEFAULT_ARTIST,
    catalog_title: catalogTitle,
    created_at: createdAtIso,
    created_by_email: getCurrentUserEmail_(),
    created_by_user_key: normalizeCatalogText_(payload.createdByUserKey),
    execution_profile: executionProfile.profileKey,
    job_id: buildCatalogJobId_(createdAtIso),
    output_filename: outputFilename,
    output_folder_id: outputFolderId,
    scope_mode: scopeMode,
    sheet_ids_json: JSON.stringify(selection.map((tab) => tab.sheetId)),
    sheet_titles_json: JSON.stringify(selection.map((tab) => tab.title)),
    status: 'queued',
  };

  appendCatalogRow_(jobsSheet, CATALOG_JOB_HEADERS, jobRecord);
  PropertiesService.getUserProperties().setProperty('default_execution_profile', executionProfile.profileKey);
  SpreadsheetApp.getActive().toast(`Queued job ${jobRecord.job_id}`, CATALOG_MENU_TITLE, 5);

  return {
    jobId: jobRecord.job_id,
    jobsSheetName: jobsSheet.getName(),
    outputFilename: outputFilename,
  };
}

function openCatalogJobsFromSidebar() {
  showCatalogJobsSheet();
}

function showCatalogSidebar_(prefill) {
  const template = HtmlService.createTemplateFromFile('CatalogSidebar');
  const model = buildCatalogSidebarModel_(prefill || {});
  template.initialStateJson = JSON.stringify(model).replace(/</g, '\\u003c');
  SpreadsheetApp.getUi()
    .showSidebar(
      template
        .evaluate()
        .setTitle(CATALOG_SIDEBAR_TITLE),
    );
}

function buildCatalogSidebarModel_(prefill) {
  const spreadsheet = SpreadsheetApp.getActive();
  const profilesSheet = spreadsheet.getSheetByName('catalog_profiles');
  const jobsSheet = spreadsheet.getSheetByName('catalog_jobs');
  const activeSheet = spreadsheet.getActiveSheet();
  const currentUserEmail = getCurrentUserEmail_();
  const rememberedProfile = PropertiesService.getUserProperties().getProperty('default_execution_profile') || '';
  const compatibleTabs = discoverCompatibleTabs_(spreadsheet, activeSheet.getSheetId());
  const activeTabDiagnostics = getActiveTabDiagnostics_(activeSheet);
  const profiles = profilesSheet ? readCatalogProfiles_(profilesSheet) : [];
  const preselectedProfileKey = resolvePreselectedProfileKey_({
    currentUserEmail: currentUserEmail,
    preselectedProfileKey: prefill.preselectedProfileKey || '',
    profiles: profiles,
    rememberedProfile: rememberedProfile,
  });

  return {
    activeSheetId: activeSheet.getSheetId(),
    activeSheetTitle: activeSheet.getName(),
    activeTabDiagnostics: activeTabDiagnostics,
    compatibleTabs: compatibleTabs,
    currentUserEmail: currentUserEmail,
    preselectedProfileKey: preselectedProfileKey,
    preselectedSheetIds: normalizeSheetIds_(prefill.preselectedSheetIds || []).length > 0
      ? normalizeSheetIds_(prefill.preselectedSheetIds || [])
      : compatibleTabs.length > 0 && activeTabDiagnostics.isCompatible
        ? [activeSheet.getSheetId()]
        : [],
    profiles: profiles,
    scopeMode: prefill.scopeMode || 'current_tab',
    setupRequired: !profilesSheet || !jobsSheet,
  };
}

function ensureCatalogSheet_(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActive();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = sheet.getLastColumn() >= headers.length
    ? headerRange.getValues()[0]
    : [];
  const needsHeaderWrite = currentHeaders.join('||') !== headers.join('||');

  if (needsHeaderWrite) {
    if (sheet.getMaxColumns() < headers.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    }
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
  }

  sheet.setFrozenRows(1);
  return sheet;
}

function seedCatalogProfiles_(profilesSheet) {
  const lastRow = profilesSheet.getLastRow();
  if (lastRow > 1) {
    return;
  }

  const range = profilesSheet.getRange(2, 1, CATALOG_INITIAL_PROFILES.length, CATALOG_PROFILE_HEADERS.length);
  range.setValues(CATALOG_INITIAL_PROFILES);
}

function readCatalogProfiles_(profilesSheet) {
  const values = profilesSheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0].map(normalizeCatalogHeader_);

  return values
    .slice(1)
    .map((row) => mapCatalogRow_(headers, row))
    .filter((row) => row.profile_key && isEnabledCatalogFlag_(row.enabled))
    .map((row) => ({
      defaultDriveFolderId: normalizeCatalogText_(row.default_drive_folder_id),
      googleAccountEmail: normalizeCatalogText_(row.google_account_email),
      label: normalizeCatalogText_(row.label) || normalizeCatalogText_(row.profile_key),
      macosUserHint: normalizeCatalogText_(row.macos_user_hint),
      profileKey: normalizeCatalogText_(row.profile_key),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function discoverCompatibleTabs_(spreadsheet, activeSheetId) {
  const compatibleTabs = spreadsheet
    .getSheets()
    .filter((sheet) => !sheet.isSheetHidden())
    .filter((sheet) => CATALOG_HELPER_TITLES.indexOf(normalizeCatalogHeader_(sheet.getName())) === -1)
    .map((sheet) => {
      const headers = readSheetHeaders_(sheet);
      const missingRequiredHeaders = getMissingCatalogHeaders_(headers);

      return {
        isActive: sheet.getSheetId() === activeSheetId,
        isYearTitle: /^\d{4}$/.test(sheet.getName()),
        missingRequiredHeaders: missingRequiredHeaders,
        sheetId: sheet.getSheetId(),
        title: sheet.getName(),
      };
    })
    .filter((sheet) => sheet.missingRequiredHeaders.length === 0);

  compatibleTabs.sort(function (left, right) {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    if (left.isYearTitle !== right.isYearTitle) {
      return left.isYearTitle ? -1 : 1;
    }

    if (left.isYearTitle && right.isYearTitle) {
      return right.title.localeCompare(left.title);
    }

    return left.title.localeCompare(right.title);
  });

  return compatibleTabs.map(function (sheet) {
    return {
      sheetId: sheet.sheetId,
      title: sheet.title,
    };
  });
}

function getActiveTabDiagnostics_(sheet) {
  const headers = readSheetHeaders_(sheet);
  const missingRequiredHeaders = getMissingCatalogHeaders_(headers);

  return {
    isCompatible: missingRequiredHeaders.length === 0,
    missingRequiredHeaders: missingRequiredHeaders,
  };
}

function readSheetHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    return [];
  }

  return sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
}

function getMissingCatalogHeaders_(headers) {
  const normalizedHeaders = {};
  headers.forEach(function (headerValue) {
    const normalizedHeader = normalizeCatalogHeader_(headerValue);
    if (normalizedHeader) {
      normalizedHeaders[normalizedHeader] = true;
    }
  });

  return CATALOG_REQUIRED_HEADERS.filter(function (requiredHeader) {
    return !normalizedHeaders[requiredHeader];
  });
}

function resolvePreselectedProfileKey_(options) {
  const profiles = options.profiles || [];
  const currentUserEmail = normalizeCatalogText_(options.currentUserEmail).toLowerCase();
  const explicitSelection = normalizeCatalogText_(options.preselectedProfileKey);
  const rememberedProfile = normalizeCatalogText_(options.rememberedProfile);

  if (explicitSelection && profiles.some(function (profile) { return profile.profileKey === explicitSelection; })) {
    return explicitSelection;
  }

  const matchingProfiles = currentUserEmail
    ? profiles.filter(function (profile) {
        return profile.googleAccountEmail.toLowerCase() === currentUserEmail;
      })
    : [];

  if (matchingProfiles.length === 1) {
    return matchingProfiles[0].profileKey;
  }

  if (rememberedProfile && profiles.some(function (profile) { return profile.profileKey === rememberedProfile; })) {
    return rememberedProfile;
  }

  return '';
}

function resolveSheetSelection_(options) {
  const compatibleTabs = options.compatibleTabs || [];
  const scopeMode = options.scopeMode;
  const selectedSheetIds = normalizeSheetIds_(options.selectedSheetIds || []);
  const activeSheetId = options.activeSheetId;
  const compatibleTabsById = {};

  compatibleTabs.forEach(function (tab) {
    compatibleTabsById[String(tab.sheetId)] = tab;
  });

  if (scopeMode === 'current_tab') {
    const activeTab = compatibleTabsById[String(activeSheetId)];
    if (!activeTab) {
      throw new Error('The active tab is not compatible with the catalog contract.');
    }
    return [activeTab];
  }

  if (scopeMode === 'selected_tabs') {
    const selectedTabs = selectedSheetIds
      .map(function (sheetId) {
        return compatibleTabsById[String(sheetId)];
      })
      .filter(Boolean);

    if (selectedTabs.length !== selectedSheetIds.length || selectedTabs.length === 0) {
      throw new Error('Selected tabs must be compatible before queueing a job.');
    }

    return selectedTabs;
  }

  if (scopeMode === 'all_compatible_tabs') {
    if (compatibleTabs.length === 0) {
      throw new Error('No compatible tabs are available.');
    }
    return compatibleTabs;
  }

  throw new Error('Unsupported scope mode.');
}

function appendCatalogRow_(sheet, headers, rowData) {
  const rowValues = headers.map(function (header) {
    return rowData[header] || '';
  });
  sheet.appendRow(rowValues);
}

function mapCatalogRow_(headers, values) {
  return headers.reduce(function (row, header, index) {
    row[header] = values[index];
    return row;
  }, {});
}

function normalizeCatalogHeader_(value) {
  return normalizeCatalogText_(value).toLowerCase();
}

function normalizeCatalogText_(value) {
  return String(value || '').trim();
}

function normalizeSheetIds_(sheetIds) {
  return sheetIds
    .map(function (sheetId) {
      return Number(sheetId);
    })
    .filter(function (sheetId) {
      return !Number.isNaN(sheetId);
    });
}

function isEnabledCatalogFlag_(value) {
  return value === true || normalizeCatalogText_(value).toLowerCase() === 'true';
}

function buildCatalogJobId_(createdAtIso) {
  const date = new Date(createdAtIso);
  const timestamp = [
    date.getUTCFullYear(),
    padCatalogNumber_(date.getUTCMonth() + 1),
    padCatalogNumber_(date.getUTCDate()),
    '_',
    padCatalogNumber_(date.getUTCHours()),
    padCatalogNumber_(date.getUTCMinutes()),
    padCatalogNumber_(date.getUTCSeconds()),
  ].join('');
  const suffix = Utilities.getUuid().slice(0, 4).toLowerCase();
  return 'catalog_' + timestamp + '_' + suffix;
}

function sanitizeCatalogFilename_(options) {
  const stem = normalizeCatalogText_(options.catalogTitle)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'catalog';
  const date = new Date(options.timestampIso);
  const timestamp = [
    date.getUTCFullYear(),
    padCatalogNumber_(date.getUTCMonth() + 1),
    padCatalogNumber_(date.getUTCDate()),
    '_',
    padCatalogNumber_(date.getUTCHours()),
    padCatalogNumber_(date.getUTCMinutes()),
    padCatalogNumber_(date.getUTCSeconds()),
  ].join('');

  return stem + '-' + timestamp + '.pdf';
}

function sanitizeCatalogOutputFilename_(options) {
  const providedFilename = normalizeCatalogText_(options.outputFilename);
  if (!providedFilename) {
    return sanitizeCatalogFilename_(options);
  }

  const sanitized = providedFilename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  const normalizedFilename = sanitized || sanitizeCatalogFilename_(options);
  return /\.pdf$/i.test(normalizedFilename) ? normalizedFilename : normalizedFilename + '.pdf';
}

function padCatalogNumber_(value) {
  return ('0' + value).slice(-2);
}

function getCurrentUserEmail_() {
  try {
    return normalizeCatalogText_(Session.getActiveUser().getEmail());
  } catch (error) {
    return '';
  }
}
