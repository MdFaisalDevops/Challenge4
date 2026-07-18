FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy root configurations and workspaces
COPY package*.json tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/

# Install dependencies and build shared library and server
RUN npm ci
RUN npm run build -w @crowdmind/shared
RUN npm run build -w @crowdmind/server

# Clean up dev dependencies for smaller size
RUN npm prune --omit=dev

FROM node:20-alpine AS runner

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules/ node_modules/
COPY --from=builder /usr/src/app/packages/shared/ packages/shared/
COPY --from=builder /usr/src/app/apps/server/dist/ apps/server/dist/
COPY --from=builder /usr/src/app/apps/server/package.json apps/server/package.json

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start", "-w", "@crowdmind/server"]
