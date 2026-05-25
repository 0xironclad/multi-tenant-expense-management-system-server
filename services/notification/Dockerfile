FROM node:20-alpine AS builder
WORKDIR /app/services/notification
COPY packages/types /app/packages/types
COPY services/notification/package*.json ./
RUN npm ci
COPY services/notification/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app/services/notification
ENV NODE_ENV=production
COPY packages/types /app/packages/types
COPY services/notification/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/services/notification/dist ./dist
CMD ["node", "dist/index.js"]
