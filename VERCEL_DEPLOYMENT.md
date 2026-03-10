# Vercel Backend Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm i -g vercel`
- PostgreSQL database (use Neon, Supabase, or Railway)
- MongoDB database (use MongoDB Atlas)
- Gemini API key

## Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```

## Step 3: Set Up Environment Variables
You need to set these environment variables in your Vercel project:

### Required Environment Variables:
```
DATABASE_URL=your-postgresql-connection-string
MONGODB_URL=your-mongodb-connection-string
SECRET_KEY=your-super-secret-key-min-32-chars
GEMINI_API_KEY=your-gemini-api-key
ENVIRONMENT=production
DEBUG=False
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,https://your-backend-url.vercel.app
```

### Set environment variables using CLI:
```bash
vercel env add DATABASE_URL
vercel env add MONGODB_URL
vercel env add SECRET_KEY
vercel env add GEMINI_API_KEY
vercel env add ALLOWED_ORIGINS
```

Or set them in the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable

## Step 4: Deploy to Vercel

### Option A: Deploy via CLI
```bash
# From the project root directory
vercel

# For production deployment
vercel --prod
```

### Option B: Deploy via GitHub
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy on every push to main branch

## Step 5: Configure Database

### PostgreSQL (Recommended: Neon or Supabase)
1. Sign up for Neon (free): https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to Vercel environment variables as `DATABASE_URL`

### MongoDB Atlas (Free tier available)
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Add to Vercel environment variables as `MONGODB_URL`

## Step 6: Initialize Database
After deployment, you need to initialize the database tables:

```bash
# Run database initialization (you may need to do this locally or via a one-time script)
python backend/init_db.py
```

## Step 7: Verify Deployment
Once deployed, visit:
- API: `https://your-project.vercel.app/`
- Docs: `https://your-project.vercel.app/docs` (if DEBUG=True)

## Important Notes

### Database Connections
- Vercel functions are serverless, so use connection pooling
- For PostgreSQL, consider using PgBouncer or connection poolers
- For MongoDB, use connection pooling via pymongo

### File Uploads
- Vercel has a 50MB max request/response size
- For file uploads, consider using external storage (AWS S3, Cloudflare R2)
- Current setup stores files in /tmp (ephemeral on Vercel)

### CORS Configuration
Make sure to update `ALLOWED_ORIGINS` to include:
- Your frontend Vercel URL
- Your backend Vercel URL
- Any custom domains

Example:
```
ALLOWED_ORIGINS=https://policy-secure-frontend.vercel.app,https://policy-secure-backend.vercel.app
```

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in requirements.txt
- Check Python version compatibility (Vercel uses Python 3.9)

### Runtime Errors
- Check runtime logs in Vercel dashboard
- Verify all environment variables are set correctly
- Test database connections

### Cold Starts
- Serverless functions may have cold starts (1-2 seconds delay)
- Consider using Vercel's Edge Functions for better performance
- Or upgrade to Vercel Pro for better cold start times

## Continuous Deployment
Once connected to GitHub:
1. Push to main branch → automatic production deployment
2. Push to other branches → preview deployments
3. Pull requests → automatic preview URLs

## Monitoring
- View logs: `vercel logs`
- View deployments: `vercel ls`
- Check project: `https://vercel.com/dashboard`

## Support
- Vercel Docs: https://vercel.com/docs
- FastAPI on Vercel: https://vercel.com/docs/frameworks/fastapi
