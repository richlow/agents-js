# Cleo Healthcare Scheduling Agent 🏥

A voice-powered healthcare scheduling assistant built with LiveKit Agents for **Noosa Springs Chiropractic**.

## 🌟 Features

- **🎤 Voice-First Interface**: Natural conversation for appointment scheduling
- **📅 Complete Scheduling Workflow**: Book, cancel, and reschedule appointments
- **👥 Patient Management**: Create new patients and verify returning patients
- **🌏 Australian Timezone Support**: Brisbane/Australia timezone handling
- **🏥 Healthcare Context**: Professional medical assistant persona
- **⚡ Real-time API Integration**: Live backend connections for all operations

## 🏥 Services Supported

- **Chiropractic** (Initial 45min & Follow-up 30min)
- **Physiotherapy** (Initial 60min & Follow-up 45min)  
- **Remedial Massage** (Initial 60min)

## 👨‍⚕️ Practitioners

- **Rich Low** - Physiotherapy
- **Dr. Michael Coolican** - Chiropractic & Remedial Massage
- **Jenny Jones** - Chiropractic

## 🚀 Deployment to Render (Monorepo)

### Prerequisites

1. **LiveKit Account**: Get credentials from [LiveKit Cloud](https://cloud.livekit.io/)
2. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
3. **Deepgram API Key**: Get from [Deepgram Console](https://console.deepgram.com/)
4. **ElevenLabs API Key**: Get from [ElevenLabs](https://elevenlabs.io/)
5. **GitHub Repository**: Your monorepo needs to be on GitHub

### 🔧 Deployment Steps

#### Option 1: Auto-Deploy with render.yaml (Recommended)

1. **Ensure `render.yaml` is in your repository root**:
   ```yaml
   # render.yaml should be in the root of your repository
   services:
     - type: web
       name: cleo-healthcare-agent
       rootDir: connected-grid-225en6  # This tells Render where your service is
       buildCommand: npm install
       startCommand: npm start
   ```

2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Render will automatically detect and use the `render.yaml` configuration

3. **Set Environment Variables** in Render Dashboard:
   ```
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your-api-key
   LIVEKIT_API_SECRET=your-api-secret
   OPENAI_API_KEY=your-openai-key
   DEEPGRAM_API_KEY=your-deepgram-key
   ELEVEN_API_KEY=your-elevenlabs-key
   ```

#### Option 2: Manual Configuration

1. **Create New Web Service** in Render Dashboard
2. **Configure Service Settings**:
   - **Name**: `cleo-healthcare-agent`
   - **Environment**: `Node`
   - **Root Directory**: `connected-grid-225en6`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: `18` or higher

3. **Add Environment Variables** (same as above)

4. **Deploy**

### 🏠 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Create Environment File**:
   ```bash
   # Copy from .env.local and update with your keys
   cp .env.local .env.local.backup
   ```

3. **Test the Agent**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Available Commands**:
   ```bash
   npm start          # Start in production mode
   npm run dev        # Start in development mode
   npm run agent      # Run the basic agent example
   npm run cleo       # Run Cleo healthcare agent
   ```

### 🔍 Troubleshooting

#### Common Issues

1. **"Service Root Directory Missing"**:
   - Ensure `rootDir: connected-grid-225en6` is in your `render.yaml`
   - Or set "Root Directory" to `connected-grid-225en6` in Render dashboard

2. **Environment Variables Not Loading**:
   - Check that variables are set in Render dashboard
   - Verify `.env.local` exists for local development

3. **Port/Host Issues**:
   - Render automatically provides `PORT` environment variable
   - The agent is configured to use `process.env.PORT || 8081`

#### Debug Commands

```bash
# Test environment variables
node -e "console.log(process.env.LIVEKIT_URL)"

# Test agent without connection
node dist/cleo.js --help

# Check dependencies
npm ls
```

### 📊 Monitoring & Logs

- **View Logs**: Render Dashboard → Your Service → Logs
- **Monitor Health**: The agent includes health check endpoints
- **API Monitoring**: Check staging API at `https://agent-api-staging.connectgrid.com`

### 🔒 Security

- All API keys are stored securely in environment variables
- HTTPS/WSS connections for all external communications
- Patient data handling follows healthcare privacy standards

### 🎯 Testing Your Deployed Agent

1. **Get your LiveKit Room URL** from the deployment logs
2. **Use LiveKit's playground** or connect directly to test voice interactions
3. **Test appointment booking workflow**:
   - Patient verification
   - Availability checking
   - Appointment creation
   - Appointment management

### 📱 Integration

The agent integrates with:
- **LiveKit Cloud** for voice communication
- **OpenAI** for natural language processing
- **Deepgram** for speech-to-text
- **ElevenLabs** for text-to-speech
- **ConnectGrid API** for appointment management

### 🆘 Support

For deployment issues:
1. Check Render service logs
2. Verify all environment variables are set
3. Test locally first with `npm run dev`
4. Ensure your monorepo structure matches the expected layout

---

**🏥 Ready to help patients schedule their healthcare appointments at Noosa Springs Chiropractic!** 