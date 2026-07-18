FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app

COPY package*.json tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package*.json tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build -w @crowdmind/shared
RUN npm run build -w @crowdmind/web

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone outputs
COPY --from=builder /usr/src/app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
