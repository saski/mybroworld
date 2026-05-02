export function summarizeCloudRunOnceResult(result) {
  if (!result) {
    return {
      exitCode: 0,
      logLevel: 'log',
      message: '[catalog-agent] no queued jobs matched the configured profile',
    };
  }

  const status = String(result.status || '').trim() || 'unknown';
  const jobId = String(result.jobId || '').trim() || '<unknown-job>';

  return {
    exitCode: status === 'failed' ? 1 : 0,
    logLevel: status === 'failed' ? 'error' : 'log',
    message: `[catalog-agent] ${status} ${jobId}`,
  };
}
