# ── Stage 1: Install dependencies ──────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps

# ── Stage 2: Build the application ────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use /tmp for the build-time SQLite DB so workers don't conflict
ENV DB_DIR=/tmp/build-db
RUN npm run build

# ── Stage 3: Production image ─────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server
COPY --from=builder /app/.next/standalone ./
# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
# Copy public folder (if it exists)
COPY --from=builder /app/public ./public
# Copy drizzle migrations for runtime migration
COPY --from=builder /app/drizzle ./drizzle

# Create data directory for SQLite and set ownership
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# The SQLite database is stored in /app/data — mount a volume here
VOLUME ["/app/data"]

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
