# Fly.io Deployment Guide for Cleo Healthcare Agent

## Prerequisites

1. Install the Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Sign up for a Fly.io account: https://fly.io/app/sign-up
3. Log in to Fly CLI: `flyctl auth login`

## Environment Variables Setup

Before deploying, you need to set the following environment variables in your Fly.io app:

### Required Environment Variables

```bash
# LiveKit Configuration
flyctl secrets set LIVEKIT_URL="wss://your-project.livekit.cloud"
flyctl secrets set LIVEKIT_API_KEY="your-livekit-api-key"
flyctl secrets set LIVEKIT_API_SECRET="your-livekit-api-secret"

# AI Service APIs
flyctl secrets set OPENAI_API_KEY="your-openai-api-key"
flyctl secrets set DEEPGRAM_API_KEY="your-deepgram-api-key"
flyctl secrets set ELEVEN_API_KEY="your-elevenlabs-api-key"
```

### Optional Environment Variables

```bash
# Logging (defaults to 'info')
flyctl secrets set LOG_LEVEL="debug"

# Additional configuration
flyctl secrets set NODE_ENV="production"
```

## Deployment Steps

### 1. Create the Fly App

```bash
flyctl apps create agents-js
```

### 2. Set Environment Variables

Run the commands from the "Required Environment Variables" section above.

### 3. Deploy

```bash
flyctl deploy
```

### 4. Monitor the Deployment

```bash
flyctl logs
```

### 5. Check App Status

```bash
flyctl status
```

## Troubleshooting

### Common Issues

1. **ONNX Runtime Build Errors**: The Dockerfile includes specific handling for `onnxruntime-node` build issues. If you still encounter problems, try:
   ```bash
   flyctl deploy --build-arg NODE_OPTIONS="--max-old-space-size=2048"
   ```

2. **Memory Issues**: If the app runs out of memory, increase the VM size:
   ```bash
   flyctl scale memory 2048
   ```

3. **Health Check Failures**: The app includes a health check endpoint at `/health`. If it fails:
   - Check if the app is binding to the correct port (8080)
   - Verify the LiveKit credentials are correct
   - Check logs for startup errors

### Monitoring

- **Logs**: `flyctl logs`
- **Metrics**: Visit your app dashboard at https://fly.io/apps/agents-js
- **Health**: The app includes health checks at `/health`

## App Configuration

The app is configured with:
- **Region**: Chicago (ord) - change in `fly.toml` if needed
- **Memory**: 1GB (can be scaled up)
- **CPU**: 1 shared core
- **Port**: 8080 (internal)
- **Health Check**: `/health` endpoint

## Scaling

To scale the app:

```bash
# Scale memory
flyctl scale memory 2048

# Scale CPU
flyctl scale count 2

# Scale to specific regions
flyctl scale count 2 --region ord,dfw
```

## Environment File Template

Create a `.env.local` file in the `connected-grid-225en6` directory for local development:

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# AI Service APIs
OPENAI_API_KEY=your-openai-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
ELEVEN_API_KEY=your-elevenlabs-api-key

# Optional
LOG_LEVEL=debug
NODE_ENV=development
```

## Update App

To update the app after changes:

```bash
flyctl deploy
```

The deployment will automatically build the new Docker image and replace the running instances. 