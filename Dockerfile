FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/readest-app/package.json ./apps/readest-app/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/readest-app/node_modules ./apps/readest-app/node_modules
COPY . .
RUN cd apps/readest-app && pnpm build-web

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3450
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/readest-app/.next ./.next
COPY --from=builder /app/apps/readest-app/node_modules ./node_modules
COPY --from=builder /app/apps/readest-app/package.json ./
COPY --from=builder /app/apps/readest-app/.env.web ./.env.web
COPY --from=builder /app/apps/readest-app/public ./public

USER nextjs
EXPOSE 3450

CMD ["sh", "-c", "source .env.web && npx next start"]
