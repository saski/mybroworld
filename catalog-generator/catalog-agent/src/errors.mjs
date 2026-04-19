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
