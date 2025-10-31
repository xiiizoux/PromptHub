# ============================================
# Production-grade Multi-stage Dockerfile
# Supports React 19 + Next.js 15
# ============================================

# ============================================
# Stage 1: Dependency Installation
# ============================================
FROM node:20-alpine AS dependencies

# Install system dependencies
RUN apk update && apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    python3 \
    python3-dev \
    make \
    g++ \
    git

WORKDIR /app

# Copy package.json files
COPY mcp/package*.json ./mcp/
COPY web/package*.json ./web/
COPY supabase/package*.json ./supabase/

# Set memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install MCP dependencies (need devDependencies for TypeScript compilation)
# MCP uses standard npm ci, no --legacy-peer-deps needed
RUN cd mcp && npm ci

# Install Web dependencies (need devDependencies for build)
# React 19 is compatible with all dependencies, use npm install instead of npm ci to handle dependency updates
RUN cd web && rm -f package-lock.json && npm install

# Install Supabase dependencies
RUN cd supabase && npm ci || echo "Supabase dependency installation skipped"

# ============================================
# Stage 2: Web Build Stage
# ============================================
FROM node:20-alpine AS web-builder

WORKDIR /app

# Define build arguments (must be passed via --build-arg during build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG SUPABASE_URL

# Validate required build arguments (fail immediately if empty with clear error message)
# This is a critical step: ensure docker-compose.yml's build.args correctly passes variables
RUN if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then \
      echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set or empty"; \
      echo "   Possible causes:"; \
      echo "   1. NEXT_PUBLIC_SUPABASE_URL variable missing in .env file"; \
      echo "   2. docker-compose.yml's build.args configuration error"; \
      echo "   3. Docker Compose failed to read .env file correctly"; \
      echo "   Please check .env file and docker-compose.yml configuration"; \
      exit 1; \
    fi && \
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then \
      echo "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or empty"; \
      echo "   Possible causes:"; \
      echo "   1. NEXT_PUBLIC_SUPABASE_ANON_KEY variable missing in .env file"; \
      echo "   2. docker-compose.yml's build.args configuration error"; \
      echo "   3. Docker Compose failed to read .env file correctly"; \
      echo "   Please check .env file and docker-compose.yml configuration"; \
      exit 1; \
    fi && \
    echo "✓ Build argument validation passed" && \
    echo "  NEXT_PUBLIC_SUPABASE_URL is set (length: $(echo -n "$NEXT_PUBLIC_SUPABASE_URL" | wc -c))" && \
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY is set (length: $(echo -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | wc -c))"

# Copy dependencies
COPY --from=dependencies /app/web/node_modules ./web/node_modules
COPY --from=dependencies /app/mcp/node_modules ./mcp/node_modules

# Copy source code
COPY web ./web
COPY mcp ./mcp

# Set build environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Convert build arguments to environment variables for Next.js build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV SUPABASE_URL=${SUPABASE_URL}

# Build Next.js application
RUN cd web && npm run build

# Build MCP application (compile TypeScript to JavaScript)
RUN cd mcp && npm run build

# Verify MCP build artifacts exist
RUN if [ ! -f "/app/mcp/dist/src/index.js" ]; then \
      echo "❌ Error: MCP compilation failed, dist/src/index.js does not exist"; \
      echo "   Please check MCP's TypeScript compilation configuration"; \
      exit 1; \
    fi && \
    echo "✓ MCP compilation successful, build artifacts generated"

# Clean up Web and MCP dev dependencies, keep only production dependencies
RUN cd web && npm prune --production
RUN cd mcp && npm prune --production

# ============================================
# Stage 3: Production Runtime Stage
# ============================================
FROM node:20-alpine AS production

# Install runtime system dependencies (only essential ones)
RUN apk update && apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    curl \
    tini

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy MCP build artifacts and production dependencies
COPY --from=web-builder --chown=nodejs:nodejs /app/mcp/node_modules ./mcp/node_modules
COPY --from=web-builder --chown=nodejs:nodejs /app/mcp ./mcp

# Copy Web build artifacts and production dependencies
COPY --from=web-builder --chown=nodejs:nodejs /app/web/.next ./web/.next
COPY --from=web-builder --chown=nodejs:nodejs /app/web/node_modules ./web/node_modules
COPY --from=web-builder --chown=nodejs:nodejs /app/web/public ./web/public
COPY --chown=nodejs:nodejs web/package*.json ./web/
COPY --chown=nodejs:nodejs web/next.config.js ./web/

# Copy Supabase dependencies and code
COPY --from=dependencies --chown=nodejs:nodejs /app/supabase/node_modules ./supabase/node_modules
COPY --chown=nodejs:nodejs supabase ./supabase

# Copy other necessary files
COPY --chown=nodejs:nodejs docker-start.sh ./
COPY --chown=nodejs:nodejs .env* ./

# Create necessary directories
RUN mkdir -p /app/logs /app/mcp/data && \
    chown -R nodejs:nodejs /app/logs /app/mcp/data

# Set permissions
RUN chmod +x /app/docker-start.sh

# Set production environment variables
ENV NODE_ENV=production \
    PORT=9010 \
    FRONTEND_PORT=9011 \
    TRANSPORT_TYPE=sse \
    NEXT_TELEMETRY_DISABLED=1

# Expose ports
EXPOSE 9010 9011

# Switch to non-root user
USER nodejs

# Use tini as init process (graceful signal handling)
ENTRYPOINT ["/sbin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${FRONTEND_PORT}/ || exit 1

# Startup command
CMD ["/bin/sh", "/app/docker-start.sh"]
