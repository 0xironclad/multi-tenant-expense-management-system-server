FROM node:20-alpine AS builder
WORKDIR /app/services/gateway
COPY services/gateway/package*.json ./
RUN npm ci
COPY services/gateway/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app/services/gateway
ENV NODE_ENV=production
COPY services/gateway/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/services/gateway/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
