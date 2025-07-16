# Fly.io Deployment Guide for Cleo Healthcare Agent

## Prerequisites

1. **Install Fly CLI**: https://fly.io/docs/getting-started/installing-flyctl/
2. **Sign up for Fly.io account**: https://fly.io/app/sign-up
3. **Log in to Fly CLI**: `flyctl auth login`

## Quick Start

Navigate to the application directory:
```bash
cd connected-grid-225en6
```

## Environment Variables Setup

Set the following environment variables in your Fly.io app:

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
# Application Configuration
flyctl secrets set LOG_LEVEL="info"
flyctl secrets set NODE_ENV="production"
```

## Deployment Steps

### 1. Initialize Fly App

```bash
# Create a new Fly app (from the connected-grid-225en6 directory)
flyctl launch --no-deploy

# Or if you want to specify the app name
flyctl launch --name cleo-healthcare-agent --no-deploy
```

### 2. Set Environment Variables

Use the commands from the "Environment Variables Setup" section above.

### 3. Deploy

```bash
flyctl deploy
```

### 4. Monitor Deployment

```bash
# Check deployment status
flyctl status

# View logs
flyctl logs

# Check health
flyctl checks list
```

## Troubleshooting

### Common Issues

1. **ONNX Runtime Build Issues**:
   - The Dockerfile includes fallback strategies for onnxruntime-node
   - If silero plugin fails, the build will continue without it

2. **Memory Issues**:
   - Current configuration uses 1GB RAM
   - Increase if needed: `flyctl scale memory 2048`

3. **Port/Host Issues**:
   - The agent uses PORT from environment (default 8080)
   - HOST is set to "0.0.0.0" for container compatibility

### Debug Commands

```bash
# SSH into the running container
flyctl ssh console

# Scale the application
flyctl scale count 2

# Check resource usage
flyctl metrics

# View build logs
flyctl logs --app cleo-healthcare-agent
```

## Health Checks

The application includes health checks at the root path `/`. Fly.io will automatically check this endpoint every 30 seconds.

## Scaling

```bash
# Scale to 2 instances
flyctl scale count 2

# Scale memory to 2GB
flyctl scale memory 2048

# Scale CPU to 2 cores
flyctl scale vm performance-2x
```

## Configuration Files

- `fly.toml`: Fly.io configuration
- `Dockerfile`: Container build configuration  
- `.dockerignore`: Excludes unnecessary files from build context

## Testing Your Deployment

1. **Get your app URL**: `flyctl info`
2. **Test health endpoint**: `curl https://your-app.fly.dev/`
3. **Connect to LiveKit**: Use the deployed agent with your LiveKit room

## Support

For deployment issues:
1. Check `flyctl logs` for error messages
2. Verify all environment variables are set with `flyctl secrets list`
3. Test locally first with `npm run dev`
4. Check the Fly.io dashboard for resource usage

---

**🏥 Your Cleo Healthcare Agent is ready to help patients at Noosa Springs Chiropractic!** 