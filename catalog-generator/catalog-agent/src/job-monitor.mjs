import { createAgentContext } from './agent.mjs';

const DEFAULT_FAILED_LOOKBACK_HOURS = 24;
const DEFAULT_QUEUED_STALE_MINUTES = 15;
const DEFAULT_IN_PROGRESS_STALE_MINUTES = 10;
const DEFAULT_COMPLETED_LOOKBACK_HOURS = 24;
const IN_PROGRESS_STATUSES = new Set([
  'claimed',
  'exporting',
  'merging',
  'rendering',
  'uploading',
]);

function parseTimestamp(value) {
  const timestamp = new Date(String(value || '').trim());
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function minutesBetween(later, earlier) {
  return (later.getTime() - earlier.getTime()) / 60_000;
}

function hoursBetween(later, earlier) {
  return minutesBetween(later, earlier) / 60;
}

function jobTimestamp(job, fields) {
  for (const field of fields) {
    const timestamp = parseTimestamp(job[field]);
    if (timestamp) {
      return timestamp;
    }
  }

  return null;
}

function addAlert(alerts, code, job, message) {
  alerts.push({
    code,
    jobId: String(job.job_id || '').trim(),
    message,
    status: String(job.status || '').trim(),
  });
}

export function summarizeCatalogJobHealth({
  completedLookbackHours = DEFAULT_COMPLETED_LOOKBACK_HOURS,
  executionProfile = '',
  failedLookbackHours = DEFAULT_FAILED_LOOKBACK_HOURS,
  ignoreBefore = '',
  inProgressStaleMinutes = DEFAULT_IN_PROGRESS_STALE_MINUTES,
  jobs = [],
  now = new Date(),
  queuedStaleMinutes = DEFAULT_QUEUED_STALE_MINUTES,
} = {}) {
  const alerts = [];
  const ignoreBeforeTimestamp = parseTimestamp(ignoreBefore);
  const monitoredJobs = String(executionProfile || '').trim()
    ? jobs.filter((job) => String(job.execution_profile || '').trim() === executionProfile)
    : jobs;

  for (const job of monitoredJobs) {
    const status = String(job.status || '').trim();
    const jobId = String(job.job_id || '').trim() || '<unknown-job>';

    if (status === 'failed') {
      const failedAt = jobTimestamp(job, ['completed_at', 'heartbeat_at', 'started_at', 'created_at']);
      if (ignoreBeforeTimestamp && failedAt && failedAt < ignoreBeforeTimestamp) {
        continue;
      }
      if (!failedAt || hoursBetween(now, failedAt) <= failedLookbackHours) {
        addAlert(
          alerts,
          'catalog_job_failed',
          job,
          `${jobId} failed: ${job.error_code || job.error_message || 'unknown error'}`,
        );
      }
      continue;
    }

    if (status === 'queued') {
      const queuedAt = jobTimestamp(job, ['created_at']);
      if (queuedAt && minutesBetween(now, queuedAt) > queuedStaleMinutes) {
        addAlert(
          alerts,
          'catalog_job_queued_stale',
          job,
          `${jobId} has been queued for more than ${queuedStaleMinutes} minutes.`,
        );
      }
      continue;
    }

    if (IN_PROGRESS_STATUSES.has(status)) {
      const heartbeatAt = jobTimestamp(job, ['heartbeat_at', 'started_at', 'claimed_at', 'created_at']);
      if (!heartbeatAt || minutesBetween(now, heartbeatAt) > inProgressStaleMinutes) {
        addAlert(
          alerts,
          'catalog_job_heartbeat_stale',
          job,
          `${jobId} is ${status} with a stale heartbeat.`,
        );
      }
      continue;
    }

    if (status === 'completed' && !String(job.result_file_url || '').trim()) {
      const completedAt = jobTimestamp(job, ['completed_at', 'heartbeat_at']);
      if (ignoreBeforeTimestamp && completedAt && completedAt < ignoreBeforeTimestamp) {
        continue;
      }
      if (!completedAt || hoursBetween(now, completedAt) <= completedLookbackHours) {
        addAlert(
          alerts,
          'catalog_job_completed_without_url',
          job,
          `${jobId} completed without a Drive result URL.`,
        );
      }
    }
  }

  return {
    alertCount: alerts.length,
    alerts,
    checkedJobCount: monitoredJobs.length,
    status: alerts.length > 0 ? 'alert' : 'ok',
  };
}

export async function runCatalogJobMonitor({
  configPath,
  env = process.env,
  logger = console,
  now = new Date(),
} = {}) {
  const { config, googleClient } = await createAgentContext({ configPath, logger });
  const summaries = [];

  for (const spreadsheetId of config.watchSpreadsheetIds) {
    const jobsSheet = await googleClient.getJobsSheetRecords(spreadsheetId);
    summaries.push({
      spreadsheetId,
      ...summarizeCatalogJobHealth({
        executionProfile: config.profileKey,
        ignoreBefore: env.CATALOG_MONITOR_IGNORE_BEFORE || '',
        jobs: jobsSheet.records,
        now,
      }),
    });
  }

  const alerts = summaries.flatMap((summary) => summary.alerts.map((alert) => ({
    ...alert,
    spreadsheetId: summary.spreadsheetId,
  })));

  if (alerts.length > 0) {
    logger.error(`[catalog-monitor] alert count=${alerts.length}`);
    for (const alert of alerts) {
      logger.error(`[catalog-monitor] ${alert.code} job=${alert.jobId} spreadsheet=${alert.spreadsheetId} ${alert.message}`);
    }
  } else {
    const checkedJobCount = summaries.reduce((total, summary) => total + summary.checkedJobCount, 0);
    logger.log(`[catalog-monitor] ok spreadsheets=${summaries.length} jobs=${checkedJobCount}`);
  }

  return {
    alertCount: alerts.length,
    alerts,
    status: alerts.length > 0 ? 'alert' : 'ok',
    summaries,
  };
}
