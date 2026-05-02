export class CatalogAgentError extends Error {
  constructor({ cause, code, message }) {
    super(message);
    this.name = 'CatalogAgentError';
    this.code = code;
    this.cause = cause;
  }
}

export function normalizeAgentError(error, fallbackCode = 'catalog_agent_failed') {
  if (error instanceof CatalogAgentError) {
    return error;
  }

  if (error instanceof Error) {
    return new CatalogAgentError({
      cause: error,
      code: error.code || fallbackCode,
      message: error.message,
    });
  }

  return new CatalogAgentError({
    code: fallbackCode,
    message: String(error),
  });
}

function formatSingleError(error) {
  if (error instanceof Error) {
    return error.stack || `${error.name}: ${error.message}`;
  }

  return String(error);
}

export function formatAgentErrorForLog(error) {
  const parts = [];
  const seenErrors = new Set();
  let currentError = error;

  while (currentError && !seenErrors.has(currentError)) {
    seenErrors.add(currentError);
    parts.push(formatSingleError(currentError));
    currentError = currentError instanceof Error ? currentError.cause : null;
  }

  return parts.join('\nCaused by: ');
}
