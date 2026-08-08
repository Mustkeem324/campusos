type EnvironmentRecord = Record<string, string | undefined>;

type Resolution = {
  canonicalName: 'DATABASE_URL' | 'REDIS_URL';
  sourceName: string;
};

const SERVICE_ALIASES = {
  DATABASE_URL: [
    'campusos_DATABASE_URL',
    'CAMPUSOS_DATABASE_URL',
    'campusos_POSTGRES_URL',
    'CAMPUSOS_POSTGRES_URL',
    'campusos_PRISMA_DATABASE_URL',
    'CAMPUSOS_PRISMA_DATABASE_URL',
  ],
  REDIS_URL: ['campusos_REDIS_URL', 'CAMPUSOS_REDIS_URL'],
} as const;

const LOCAL_DATABASE_URL = 'postgresql://campusos:campusos_password@localhost:5433/campusos_db?schema=public';

function isPrismaPlaceholderDatabaseUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return new URL(value).hostname === 'db.prisma.io';
  } catch {
    return false;
  }
}

/**
 * Normalizes integration-prefixed Vercel variables to the canonical names used
 * by CampusOS. Canonical variables always win, so local, CI and explicitly
 * configured production environments keep their existing behavior.
 *
 * Secret values are never returned or logged.
 */
export function resolveServiceEnvironment(
  environment: EnvironmentRecord = process.env,
): Resolution[] {
  const resolutions: Resolution[] = [];

  // A common imported development template leaves this unreachable placeholder
  // in the shell environment. Environment variables normally take precedence
  // over `.env`, so explicitly recover only in local development. Production
  // configuration is never changed by this safeguard.
  if (
    environment.NODE_ENV !== 'production' &&
    isPrismaPlaceholderDatabaseUrl(environment.DATABASE_URL)
  ) {
    environment.DATABASE_URL = environment.CAMPUSOS_LOCAL_DATABASE_URL || LOCAL_DATABASE_URL;
    resolutions.push({ canonicalName: 'DATABASE_URL', sourceName: 'local-development-fallback' });
  }

  for (const [canonicalName, aliasNames] of Object.entries(SERVICE_ALIASES) as Array<
    [keyof typeof SERVICE_ALIASES, readonly string[]]
  >) {
    if (environment[canonicalName]) continue;

    const sourceName = aliasNames.find((name) => environment[name]);
    if (!sourceName) continue;

    environment[canonicalName] = environment[sourceName];
    resolutions.push({ canonicalName, sourceName });
  }

  return resolutions;
}
