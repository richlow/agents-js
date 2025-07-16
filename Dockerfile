FROM node:20.18.0-slim as base

# Install system dependencies for building native modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    node-gyp \
    pkg-config \
    python3 \
    python3-pip \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Install pnpm
RUN npm install -g pnpm@9.7.0

# Copy connected-grid package files
COPY connected-grid-225en6/package*.json ./connected-grid-225en6/

# Install dependencies - try with CPU-only ONNX runtime first
ENV ORT_RELEASE_VERSION=1.19.2
ENV ONNXRUNTIME_REPO=https://github.com/microsoft/onnxruntime/releases/download/v${ORT_RELEASE_VERSION}/onnxruntime-linux-x64-${ORT_RELEASE_VERSION}.tgz

# Install root dependencies
RUN cd connected-grid-225en6 && \
    npm install --production --ignore-scripts && \
    npm rebuild --production

# Copy source code
COPY connected-grid-225en6/src ./connected-grid-225en6/src

# Build the application
RUN cd connected-grid-225en6 && npm run build

# Production stage
FROM node:20.18.0-slim as production

# Install runtime dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application
COPY --from=base /app/connected-grid-225en6/node_modules ./connected-grid-225en6/node_modules
COPY --from=base /app/connected-grid-225en6/dist ./connected-grid-225en6/dist
COPY --from=base /app/connected-grid-225en6/package*.json ./connected-grid-225en6/

# Create non-root user
RUN groupadd --gid 1001 --system nodejs && \
    useradd --uid 1001 --system --gid nodejs nodejs

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 8080

# Health check is handled by fly.io

# Start the application
CMD ["node", "connected-grid-225en6/dist/cleo.js", "start"] 