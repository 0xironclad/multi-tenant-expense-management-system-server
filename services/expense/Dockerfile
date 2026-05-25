FROM node:20-alpine AS builder
WORKDIR /app/services/expense
COPY packages/types /app/packages/types
COPY services/expense/package*.json ./
RUN npm ci
COPY services/expense/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app/services/expense
ENV NODE_ENV=production
COPY packages/types /app/packages/types
COPY services/expense/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/services/expense/dist ./dist
EXPOSE 3003
CMD ["node", "dist/index.js"]
