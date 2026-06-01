FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY eventful-frontend/package.json eventful-frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --ignore-scripts
COPY eventful-frontend/ .
RUN pnpm build

FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY eventful-backend/package.json eventful-backend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --ignore-scripts
COPY eventful-backend/ .
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./
COPY --from=frontend-build /app/frontend/dist ./frontend-dist
EXPOSE 3000
CMD ["node", "dist/main"]
