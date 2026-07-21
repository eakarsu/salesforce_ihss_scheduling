FROM node:22-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS backend-dependencies
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production APP_HOST=0.0.0.0 BACKEND_PORT=4003 FRONTEND_DIST=/app/public
WORKDIR /app
COPY --from=backend-dependencies /build/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/
COPY --from=frontend-build /build/frontend/dist ./public/
USER node
EXPOSE 4003
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:4003/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "backend/server.js"]
