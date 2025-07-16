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
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Create a temporary package.json without silero for build
RUN cp package.json package.json.backup && \
    node -e "const pkg = require('./package.json'); delete pkg.dependencies['@livekit/agents-plugin-silero']; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Install dependencies without silero plugin
RUN npm ci --only=production

# Restore original package.json
RUN mv package.json.backup package.json

# Copy application source
COPY src/ ./src/

# Build the application
RUN npm run build

# Create non-root user
RUN groupadd -g 1001 -r nodejs && \
    useradd -r -g nodejs -u 1001 nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check is handled by fly.io
HEALTHCHECK NONE

# Start the application
CMD ["npm", "start"] 