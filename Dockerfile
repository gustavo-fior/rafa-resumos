# --- Builder: install deps + bundle the Hono server ---
FROM oven/bun:1.2.19 AS builder
WORKDIR /app

# Copy the whole monorepo (workspace packages are needed to resolve + bundle).
COPY . .

RUN bun install --frozen-lockfile
RUN cd apps/server && bun run build

# --- Runtime: only node_modules + the bundled server ---
FROM oven/bun:1.2.19-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

# tsdown inlines all @rafa-resumos/* code; external deps stay in node_modules.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./dist

EXPOSE 8000
CMD ["bun", "run", "dist/main.mjs"]
