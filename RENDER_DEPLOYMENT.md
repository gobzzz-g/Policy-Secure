# Render Deployment Guide - Policy Secure Backend

## Prerequisites
- GitHub account
- Render account (sign up at https://render.com - Free tier available)
- Your repository pushed to GitHub

## Automatic Deployment (Recommended)

### Step 1: Connect to Render
1. Go to https://render.com and sign up/login
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository: `gobzzz-g/Policy-Secure`
4. Render will automatically detect the `render.yaml` file

### Step 2: Configure Environment Variables
Before deploying, you'll be prompted to add environment variables:

**Required Variables:**
- `GEMINI_API_KEY` - Your Google Gemini API key (get from https://makersuite.google.com/app/apikey)
-  `MONGODB_URL` - MongoDB connection string (or use default)
- `ALLOWED_ORIGINS` - Your frontend URL(s), comma-separated

**Auto-Generated:**
- `DATABASE_URL` - Automatically created from PostgreSQL database
- `SECRET_KEY` - Automatically generated secure key

### Step 3: Deploy
1. Click "Apply" to create services
2. Render will:
   - Create a PostgreSQL database
   - Build your backend
   - Deploy the service
   - Provide you with a URL like `https://policy-secure-backend.onrender.com`

### Step 4: Initialize Database
After first deployment, you need to initialize the database:

1. Go to your service in Render dashboard
2. Click "Shell" tab
3. Run:
```bash
cd backend
python init_db.py
```

## Manual Deployment (Alternative)

### Step 1: Create PostgreSQL Database
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Name: `policy-secure-db`
3. Database: `insurance_claims`
4. User: `policy_secure_user`
5. Plan: Free
6. Click "Create Database"
7. Copy the "Internal Database URL"

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `policy-secure-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Runtime**: Python 3
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### Step 3: Add Environment Variables
In the "Environment" section, add:

```
ENVIRONMENT=production
DEBUG=False
DATABASE_URL=<paste-internal-database-url-from-step-1>
SECRET_KEY=<generate-random-32-char-string>
GEMINI_API_KEY=<your-gemini-api-key>
MONGODB_URL=mongodb://localhost:27017/
ALLOWED_ORIGINS=https://your-frontend-url.com
```

Generate SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Deploy
Click "Create Web Service" - Render will build and deploy your app.

## Post-Deployment

### Access Your API
Your backend will be available at: `https://policy-secure-backend.onrender.com`

Test it:
```bash
curl https://policy-secure-backend.onrender.com
curl https://policy-secure-backend.onrender.com/health
```

### Initialize Database (First Time Only)
1. Go to Render dashboard → Your service → "Shell"
2. Run:
```bash
cd backend
python init_db.py
python create_superuser.py
```

### Update Frontend Configuration
Update your frontend to use the Render backend URL:
```javascript
// frontend/src/services/api.js
const API_URL = 'https://policy-secure-backend.onrender.com';
```

## Important Notes

### Free Tier Limitations
- **Cold Starts**: Free services spin down after 15 minutes of inactivity
  - First request after inactivity may take 30-60 seconds
- **750 hours/month**: Enough for continuous operation
- **Database**: 1GB storage on free PostgreSQL

### Automatic Deploys
- Render automatically redeploys when you push to the `main` branch
- Monitor deployments in the Render dashboard

### Database Backups
- Free tier doesn't include automatic backups
- Upgrade to paid plan for automatic daily backups
- Or manually backup using pg_dump

### MongoDB Setup (Optional)
If you need MongoDB:
1. Sign up for MongoDB Atlas: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to Render environment variables as `MONGODB_URL`

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `backend/requirements.txt`
- Check Python version compatibility

### Service Won't Start
- Check service logs
- Verify environment variables are set correctly
- Ensure `DATABASE_URL` is correct
- Test database connection

### Database Connection Errors
- Use the "Internal Database URL" from Render (not external)
- Format: `postgresql://user:password@host:port/database`
- Check if database service is running

### CORS Errors
- Update `ALLOWED_ORIGINS` environment variable
- Include your frontend URL
- Don't use `*` in production

## Monitoring

### View Logs
1. Go to your service in Render dashboard
2. Click "Logs" tab
3. Real-time logs will appear

### Metrics
- CPU usage
- Memory usage
- Response times
- Available in Render dashboard

## Scaling

### Upgrade Plans
- **Starter**: $7/month - No cold starts, more resources
- **Standard**: $25/month - More powerful instances
- **Pro**: Custom pricing - High availability, autoscaling

### Database Scaling
- Free: 1 GB
- Paid plans: Up to 400 GB
- Connection pooling available

## Custom Domain (Optional)
1. Go to Settings → Custom Domain
2. Add your domain
3. Configure DNS records as shown
4. SSL certificate automatically provisioned

## Support
- Render Docs: https://render.com/docs
- Community: https://community.render.com
- FastAPI Docs: https://fastapi.tiangolo.com

## Cost Estimate
- **Free Tier**: $0/month (with limitations)
- **Minimal Production**: ~$14/month (Starter plan + database)
- **Recommended**: ~$32/month (Standard plan + database backup)
