import {
  databaseUnavailableLog,
  isDatabaseUnavailableError,
} from './database-errors';
import { prisma } from './db';

export type ComponentHealthStatus = 'operational' | 'unavailable';
export type OverallHealthStatus = 'operational' | 'degraded';

export type ComponentHealth = {
  status: ComponentHealthStatus;
  latencyMs: number | null;
};

export type SystemHealthSnapshot = {
  status: OverallHealthStatus;
  service: 'CampusOS';
  timestamp: string;
  environment: string;
  region: string | null;
  version: string;
  uptimeSeconds: number;
  checks: {
    application: ComponentHealth;
    database: ComponentHealth;
  };
};

const DATABASE_TIMEOUT_MS = 1_500;
const HEALTH_ROUTE = '/api/health/ready';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error('DATABASE_HEALTH_TIMEOUT'));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

async function checkDatabase(): Promise<ComponentHealth> {
  const startedAt = Date.now();

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, DATABASE_TIMEOUT_MS);

    return {
      status: 'operational',
      latencyMs: Date.now() - startedAt,
    };
  } catch (error: unknown) {
    if (
      isDatabaseUnavailableError(error) ||
      (error instanceof Error && error.message === 'DATABASE_HEALTH_TIMEOUT')
    ) {
      databaseUnavailableLog(error, HEALTH_ROUTE);
    } else {
      console.error(JSON.stringify({
        event: 'database_health_check_failed',
        route: HEALTH_ROUTE,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }));
    }

    return {
      status: 'unavailable',
      latencyMs: null,
    };
  }
}

function resolveVersion(): string {
  return (
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    'development'
  );
}

export async function getSystemHealth(): Promise<SystemHealthSnapshot> {
  const database = await checkDatabase();
  const isOperational = database.status === 'operational';

  return {
    status: isOperational ? 'operational' : 'degraded',
    service: 'CampusOS',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    region: process.env.VERCEL_REGION || null,
    version: resolveVersion(),
    uptimeSeconds: Math.max(0, Math.round(process.uptime())),
    checks: {
      application: {
        status: 'operational',
        latencyMs: 0,
      },
      database,
    },
  };
}
