FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY packages/db/prisma ./packages/db/prisma
COPY scripts ./scripts
RUN npm run db:generate

COPY workers ./workers

ENV NODE_ENV=production
CMD ["node", "workers/exam-vision-worker.mjs"]
