type DatabaseLikeError = {
  name?: unknown;
  code?: unknown;
  message?: unknown;
};

const DATABASE_UNAVAILABLE_CODES = new Set(['P1001']);
const DATABASE_UNAVAILABLE_MESSAGES = [
  "Can't reach database server",
  'Could not connect to server',
  'Connection refused',
  'connection refused',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENETUNREACH',
  'EHOSTUNREACH',
] as const;

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as DatabaseLikeError;
  const code = typeof candidate.code === 'string' ? candidate.code : '';
  const name = typeof candidate.name === 'string' ? candidate.name : '';
  const message = typeof candidate.message === 'string' ? candidate.message : '';

  if (DATABASE_UNAVAILABLE_CODES.has(code)) return true;

  if (
    name === 'PrismaClientInitializationError' &&
    DATABASE_UNAVAILABLE_MESSAGES.some((fragment) => message.includes(fragment))
  ) {
    return true;
  }

  return DATABASE_UNAVAILABLE_MESSAGES.some((fragment) => message.includes(fragment));
}

export function databaseUnavailablePublicMessage(): string {
  if (process.env.NODE_ENV === 'development') {
    return 'Database is unavailable. Check DATABASE_URL and ensure PostgreSQL is running.';
  }

  return 'The service is temporarily unavailable. Please try again shortly.';
}

export function databaseUnavailableLog(error: unknown, route: string) {
  const candidate = error && typeof error === 'object' ? error as DatabaseLikeError : {};

  console.error(JSON.stringify({
    event: 'database_unavailable',
    route,
    errorName: typeof candidate.name === 'string' ? candidate.name : 'UnknownError',
    errorCode: typeof candidate.code === 'string' ? candidate.code : undefined,
  }));
}
