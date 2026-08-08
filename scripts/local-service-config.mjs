import process from 'node:process';

function resolvePort(name, fallback) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be a valid TCP port between 1 and 65535.`);
  }

  return value;
}

export function getLocalServicePorts() {
  return {
    postgres: resolvePort('CAMPUSOS_POSTGRES_HOST_PORT', 5433),
    redis: resolvePort('CAMPUSOS_REDIS_HOST_PORT', 6380),
    minioApi: resolvePort('CAMPUSOS_MINIO_API_PORT', 9000),
    minioConsole: resolvePort('CAMPUSOS_MINIO_CONSOLE_PORT', 9001),
    mailhogSmtp: resolvePort('CAMPUSOS_MAILHOG_SMTP_PORT', 1025),
    mailhogUi: resolvePort('CAMPUSOS_MAILHOG_UI_PORT', 8025),
  };
}

export function createLocalServiceEnv(overrides = {}) {
  const ports = getLocalServicePorts();

  return {
    ...process.env,
    CAMPUSOS_POSTGRES_HOST_PORT: String(ports.postgres),
    CAMPUSOS_REDIS_HOST_PORT: String(ports.redis),
    CAMPUSOS_MINIO_API_PORT: String(ports.minioApi),
    CAMPUSOS_MINIO_CONSOLE_PORT: String(ports.minioConsole),
    CAMPUSOS_MAILHOG_SMTP_PORT: String(ports.mailhogSmtp),
    CAMPUSOS_MAILHOG_UI_PORT: String(ports.mailhogUi),
    DATABASE_URL: `postgresql://campusos:campusos_password@127.0.0.1:${ports.postgres}/campusos_db?schema=public`,
    REDIS_URL: `redis://127.0.0.1:${ports.redis}`,
    S3_ENDPOINT: `http://127.0.0.1:${ports.minioApi}`,
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(ports.mailhogSmtp),
    ...overrides,
  };
}
