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

# Set environment variables for ONNX Runtime to use CPU version
ENV ONNXRUNTIME_ROOT_PATH=/usr/local/lib/onnxruntime
ENV ORT_ROOT_PATH=/usr/local/lib/onnxruntime

# Install dependencies with specific handling for onnxruntime
RUN npm ci --only=production || \
    (npm cache clean --force && \
     npm install --no-optional --production) || \
    (echo "Trying without silero plugin..." && \
     npm install --production --ignore-scripts && \
     npm rebuild --production)

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