import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { generateCatalog } from '../../src/catalog-generator.mjs';
import { DEFAULT_ARTIST_NAME } from '../../src/catalog-action-contract.mjs';
import { loadAgentConfig } from './config.mjs';
import { formatAgentErrorForLog, normalizeAgentError, CatalogAgentError } from './errors.mjs';
import { GoogleApiClient } from './google-api.mjs';
import { findOldestQueuedJob, mergeCatalogSheetsToCsv } from './job-queue.mjs';
import { loadOAuthSession } from './oauth-session.mjs';
import { resolveQueuedSheetsForProcessing } from './queued-sheets.mjs';
import { sleep, truncateText } from './utils.mjs';

function nowIso() {
  return new Date().toISOString();
}

async function safeUpdateJobFields({ googleClient, headerMap, job, logger, spreadsheetId, updates }) {
  try {
    await googleClient.updateSheetRowFields({
      headerMap,
      rowNumber: job.rowNumber,
      sheetTitle: 'catalog_jobs',
      spreadsheetId,
      updates,
    });
  } catch (error) {
    const normalizedError = normalizeAgentError(error, 'job_update_failed');
    logger.error(`[catalog-agent] failed to update job ${job.job_id}: ${normalizedError.message}`);
  }
}

async function updateJobFieldsOrThrow({ googleClient, headerMap, job, spreadsheetId, updates }) {
  await googleClient.updateSheetRowFields({
    headerMap,
    rowNumber: job.rowNumber,
    sheetTitle: 'catalog_jobs',
    spreadsheetId,
    updates,
  });
}

async function writeHeartbeat({ googleClient, headerMap, job, logger, spreadsheetId }) {
  await safeUpdateJobFields({
    googleClient,
    headerMap,
    job,
    logger,
    spreadsheetId,
    updates: {
      heartbeat_at: nowIso(),
    },
  });
}

export async function writeCatalogImageManifest({
  config,
  googleClient,
  workDirectory,
}) {
  if (!config.catalogImageFolderId) {
    return '';
  }

  const files = await googleClient.listDriveFolderFiles(config.catalogImageFolderId);
  const manifestPath = path.join(workDirectory, 'catalog-images.json');
  await fs.writeFile(manifestPath, `${JSON.stringify({ files }, null, 2)}\n`, 'utf8');
  return manifestPath;
}

async function processClaimedJob({
  config,
  googleClient,
  headerMap,
  job,
  logger,
  spreadsheetId,
}) {
  const workDirectory = path.join(config.jobWorkingRoot, job.job_id);
  const mergedCsvPath = path.join(workDirectory, 'merged-catalog.csv');
  const rawOutputFileName = String(job.output_filename || '').trim() || 'catalog.pdf';
  const outputFileName = path.basename(rawOutputFileName);
  const outputPdfPath = path.join(workDirectory, outputFileName);
  const heartbeatTimer = setInterval(() => {
    writeHeartbeat({
      googleClient,
      headerMap,
      job,
      logger,
      spreadsheetId,
    }).catch((error) => {
      const normalizedError = normalizeAgentError(error, 'heartbeat_failed');
      logger.error(`[catalog-agent] heartbeat failed for ${job.job_id}: ${normalizedError.message}`);
    });
  }, 30_000);

  try {
    await fs.mkdir(workDirectory, { recursive: true });
    await updateJobFieldsOrThrow({
      googleClient,
      headerMap,
      job,
      spreadsheetId,
      updates: {
        heartbeat_at: nowIso(),
        started_at: nowIso(),
        status: 'exporting',
      },
    });

    const spreadsheetMetadata = await googleClient.getSpreadsheetMetadata(spreadsheetId);
    const resolvedSheets = resolveQueuedSheetsForProcessing({
      job,
      spreadsheetMetadata,
    });
    const sheetPayloads = [];

    for (const resolvedSheet of resolvedSheets) {
      const sheetData = await googleClient.getSheetRows(spreadsheetId, resolvedSheet.currentTitle);
      sheetPayloads.push({
        headers: sheetData.headers,
        rows: sheetData.rows,
        sheetId: resolvedSheet.sheetId,
        title: resolvedSheet.currentTitle,
      });
    }

    await updateJobFieldsOrThrow({
      googleClient,
      headerMap,
      job,
      spreadsheetId,
      updates: {
        heartbeat_at: nowIso(),
        status: 'merging',
      },
    });

    const mergedCsv = mergeCatalogSheetsToCsv(sheetPayloads);
    await fs.writeFile(mergedCsvPath, mergedCsv, 'utf8');
    const catalogImageManifestPath = await writeCatalogImageManifest({
      config,
      googleClient,
      workDirectory,
    });

    await updateJobFieldsOrThrow({
      googleClient,
      headerMap,
      job,
      spreadsheetId,
      updates: {
        heartbeat_at: nowIso(),
        status: 'rendering',
      },
    });

    const generationResult = await generateCatalog({
      artistName: job.artist_name || DEFAULT_ARTIST_NAME,
      catalogTitle: job.catalog_title,
      catalogImageManifestPath,
      inputPath: mergedCsvPath,
      inputUrl: '',
      limit: null,
      outputPath: outputPdfPath,
    });

    await updateJobFieldsOrThrow({
      googleClient,
      headerMap,
      job,
      spreadsheetId,
      updates: {
        heartbeat_at: nowIso(),
        status: 'uploading',
      },
    });

    const uploadResult = await googleClient.uploadPdfToDrive({
      fileName: outputFileName,
      filePath: outputPdfPath,
      folderId: job.output_folder_id,
    });

    await updateJobFieldsOrThrow({
      googleClient,
      headerMap,
      job,
      spreadsheetId,
      updates: {
        completed_at: nowIso(),
        error_code: '',
        error_message: '',
        heartbeat_at: nowIso(),
        log_excerpt: `completed ${generationResult.artworkCount} artworks`,
        result_artwork_count: String(generationResult.artworkCount),
        result_file_id: uploadResult.fileId,
        result_file_url: uploadResult.fileUrl,
        result_local_path: outputPdfPath,
        status: 'completed',
      },
    });

    return {
      jobId: job.job_id,
      spreadsheetId,
      status: 'completed',
      uploadResult,
    };
  } catch (error) {
    const normalizedError = normalizeAgentError(error, 'job_processing_failed');
    const errorLog = formatAgentErrorForLog(normalizedError);
    logger.error(`[catalog-agent] job ${job.job_id} failed code=${normalizedError.code} message=${normalizedError.message}`);
    logger.error(errorLog);

    await safeUpdateJobFields({
      googleClient,
      headerMap,
      job,
      logger,
      spreadsheetId,
      updates: {
        completed_at: nowIso(),
        error_code: normalizedError.code,
        error_message: normalizedError.message,
        heartbeat_at: nowIso(),
        log_excerpt: truncateText(errorLog),
        status: 'failed',
      },
    });

    return {
      error: normalizedError,
      jobId: job.job_id,
      spreadsheetId,
      status: 'failed',
    };
  } finally {
    clearInterval(heartbeatTimer);
  }
}

async function claimQueuedJob({
  config,
  googleClient,
  headerMap,
  job,
  logger,
  spreadsheetId,
}) {
  const claimToken = randomUUID();
  const claimTimestamp = nowIso();

  await googleClient.updateSheetRowFields({
    headerMap,
    rowNumber: job.rowNumber,
    sheetTitle: 'catalog_jobs',
    spreadsheetId,
    updates: {
      claim_token: claimToken,
      claimed_at: claimTimestamp,
      claimed_by_host: os.hostname(),
      claimed_by_profile: config.profileKey,
      claimed_by_user: os.userInfo().username,
      heartbeat_at: claimTimestamp,
      status: 'claimed',
    },
  });

  const refreshedJobs = await googleClient.getJobsSheetRecords(spreadsheetId);
  const refreshedJob = refreshedJobs.records.find((record) => record.rowNumber === job.rowNumber);

  if (!refreshedJob || refreshedJob.claim_token !== claimToken) {
    logger.log(`[catalog-agent] skipped contested job ${job.job_id}`);
    return null;
  }

  return processClaimedJob({
    config,
    googleClient,
    headerMap: refreshedJobs.headerMap,
    job: refreshedJob,
    logger,
    spreadsheetId,
  });
}

export async function createAgentContext({ configPath, logger = console } = {}) {
  const config = await loadAgentConfig(configPath);
  const oauthSession = await loadOAuthSession(config);
  const googleClient = new GoogleApiClient({ oauthSession });
  const identity = await oauthSession.getIdentity();
  const identityEmail = String(identity.email || '').toLowerCase();

  if (identityEmail !== config.googleAccountEmail) {
    throw new CatalogAgentError({
      code: 'google_identity_mismatch',
      message: `Authenticated Google identity ${identityEmail || '<unknown>'} does not match configured ${config.googleAccountEmail}.`,
    });
  }

  logger.log(`[catalog-agent] authenticated as ${identityEmail}`);

  return {
    config,
    googleClient,
    logger,
  };
}

export async function processOnePass(context) {
  const { config, googleClient, logger } = context;

  for (const spreadsheetId of config.watchSpreadsheetIds) {
    let jobsSheet;

    try {
      jobsSheet = await googleClient.getJobsSheetRecords(spreadsheetId);
    } catch (error) {
      const normalizedError = normalizeAgentError(error, 'jobs_sheet_read_failed');
      logger.error(`[catalog-agent] unable to read jobs sheet for ${spreadsheetId}: ${normalizedError.message}`);
      continue;
    }

    const candidateJob = findOldestQueuedJob({
      executionProfile: config.profileKey,
      jobs: jobsSheet.records,
    });

    if (!candidateJob) {
      continue;
    }

    logger.log(`[catalog-agent] claiming ${candidateJob.job_id} from ${spreadsheetId}`);
    const result = await claimQueuedJob({
      config,
      googleClient,
      headerMap: jobsSheet.headerMap,
      job: candidateJob,
      logger,
      spreadsheetId,
    });

    if (result) {
      return result;
    }
  }

  return null;
}

export async function runAgentLoop({ configPath, logger = console, once = false } = {}) {
  const context = await createAgentContext({ configPath, logger });

  do {
    const result = await processOnePass(context);
    if (once) {
      return result;
    }

    await sleep(context.config.pollIntervalSeconds * 1000);
  } while (true);
}
