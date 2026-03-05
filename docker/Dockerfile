# ── Stage 1: Install dependencies ──────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy workspace manifests for layer caching
COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/firebase/package.json ./packages/firebase/

RUN npm ci --workspace=apps/web \
           --workspace=packages/shared \
           --workspace=packages/ui \
           --workspace=packages/firebase \
    && npm cache clean --force

# ── Stage 2: Build ─────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ARG GIT_SHA=dev
ENV GIT_SHA=${GIT_SHA}

RUN npm run build --workspace=apps/web

# ── Stage 3: Production runner ──────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
