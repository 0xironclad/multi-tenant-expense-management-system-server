FROM node:20-alpine AS builder
WORKDIR /app/services/auth
COPY packages/types /app/packages/types
COPY services/auth/package*.json ./
RUN npm ci
COPY services/auth/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app/services/auth
ENV NODE_ENV=production
COPY packages/types /app/packages/types
COPY services/auth/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/services/auth/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
