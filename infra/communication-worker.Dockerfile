FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY packages/db/prisma ./packages/db/prisma
COPY workers/communication-delivery-worker.mjs ./workers/communication-delivery-worker.mjs
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma
USER node
CMD ["node", "workers/communication-delivery-worker.mjs"]
