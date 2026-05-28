FROM node:20-alpine AS builder
WORKDIR /app/packages/types
COPY packages/types ./
RUN npm install -g typescript && tsc

WORKDIR /app/services/file
COPY services/file/package*.json ./
RUN npm ci
COPY services/file/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app/services/file
ENV NODE_ENV=production
COPY packages/types /app/packages/types
COPY --from=builder /app/packages/types/dist /app/packages/types/dist
COPY services/file/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/services/file/dist ./dist
EXPOSE 3005
CMD ["node", "dist/index.js"]
