FROM oven/bun:1 AS base
WORKDIR /app

# Install deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# Copy source & data
COPY src ./src
COPY tsconfig.json ./
# Cloud Run sets PORT env var
ENV PORT=8080
EXPOSE 8080

CMD ["bun", "run", "src/index.ts"]
