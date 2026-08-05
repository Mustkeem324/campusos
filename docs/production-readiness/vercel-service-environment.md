# Vercel service environment variables

CampusOS uses the canonical runtime names:

- `DATABASE_URL`
- `REDIS_URL`

Some Vercel integrations create project-prefixed variables instead, including:

- `campusos_DATABASE_URL`
- `campusos_POSTGRES_URL`
- `campusos_PRISMA_DATABASE_URL`
- `campusos_REDIS_URL`

The CampusOS build and runtime now normalize those aliases without printing secret values.

## Resolution order

Database connection:

1. `DATABASE_URL`
2. `campusos_DATABASE_URL`
3. `CAMPUSOS_DATABASE_URL`
4. `campusos_POSTGRES_URL`
5. `CAMPUSOS_POSTGRES_URL`
6. `campusos_PRISMA_DATABASE_URL`
7. `CAMPUSOS_PRISMA_DATABASE_URL`

Redis connection:

1. `REDIS_URL`
2. `campusos_REDIS_URL`
3. `CAMPUSOS_REDIS_URL`

Canonical variables always take priority.

## Security

- Secret values are never committed to the repository.
- The resolver logs only the source variable name, not its value.
- Production, Preview and Development environments can use separate secret values.
- Do not copy database or Redis connection strings into pull-request comments, logs or screenshots.

## Duplicate Vercel projects

Repository code cannot disconnect a duplicate Vercel project. That operation must be completed by an authorized Vercel account member under the duplicate project’s Git settings.
