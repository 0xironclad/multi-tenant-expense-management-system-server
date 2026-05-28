FROM node:20-alpine AS builder
WORKDIR /app/packages/types
COPY packages/types ./
RUN npm install -g typescript && tsc

WORKDIR /app/services/user-org
COPY services/user-org/package*.json ./
RUN npm ci
COPY services/user-org/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app/services/user-org
ENV NODE_ENV=production
COPY packages/types /app/packages/types
COPY --from=builder /app/packages/types/dist /app/packages/types/dist
COPY services/user-org/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/services/user-org/dist ./dist
EXPOSE 3002
CMD ["node", "dist/index.js"]
