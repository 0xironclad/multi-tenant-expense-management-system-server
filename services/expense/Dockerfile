FROM node:20-alpine AS builder
WORKDIR /app/packages/types
COPY packages/types ./
RUN npm install -g typescript && tsc

WORKDIR /app/services/expense
COPY services/expense/package*.json ./
RUN npm ci
COPY services/expense/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app/services/expense
ENV NODE_ENV=production
COPY packages/types /app/packages/types
COPY --from=builder /app/packages/types/dist /app/packages/types/dist
COPY services/expense/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/services/expense/dist ./dist
EXPOSE 3003
CMD ["npx", "concurrently", "-n", "api,worker", "node dist/index.js", "node dist/workers/outbox-publisher.js"]
