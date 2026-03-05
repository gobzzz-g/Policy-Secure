# PolicySecure - Firebase Deployment Guide

Complete guide to deploying PolicySecure to Firebase Hosting and Cloud Functions.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Local Development](#local-development)
5. [Production Deployment](#production-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Prerequisites

### Required Software

- **Node.js** v18 or higher
- **npm** v8 or higher
- **Firebase CLI** v12 or higher
- **Git** (for version control)

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:

```bash
firebase --version
```

---

## 🔧 Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `policysecure-app` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Create project

### 2. Enable Firebase Services

#### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Save changes

#### Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Select **Production mode**
4. Choose location (e.g., `us-central1`)

#### Storage
1. Go to **Storage**
2. Click **Get started**
3. Use production rules
4. Choose same location as Firestore

#### Functions
1. Go to **Functions**
2. Click **Get started**
3. Upgrade to **Blaze (Pay as you go)** plan (required for Cloud Functions)

### 3. Get Firebase Configuration

1. Go to **Project settings** (gear icon)
2. Scroll to **Your apps**
3. Click **Web app** icon (</>)
4. Register app with name: `PolicySecure Web`
5. Copy the configuration object

---

## ⚙️ Environment Configuration

### 1. Update Frontend Environment Variables

Create `frontend/.env.prod`:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-actual-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=policysecure-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=policysecure-app
REACT_APP_FIREBASE_STORAGE_BUCKET=policysecure-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id

# API URL (update after deploying functions)
REACT_APP_API_URL=https://us-central1-policysecure-app.cloudfunctions.net/api

# Environment
NODE_ENV=production
REACT_APP_USE_EMULATORS=false
```

### 2. Update Firebase Project Config

Edit `.firebaserc`:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 3. Set Gemini API Key for Cloud Functions

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

Or set environment variable:

```bash
# In functions directory
echo "GEMINI_API_KEY=your-key-here" > .env
```

---

## 💻 Local Development

### 1. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Functions
```bash
cd functions
npm install
```

### 2. Start Firebase Emulators

From project root:

```bash
firebase emulators:start
```

This starts:
- **Authentication** → http://localhost:9099
- **Firestore** → http://localhost:8080
- **Functions** → http://localhost:5001
- **Hosting** → http://localhost:5000
- **Storage** → http://localhost:9199
- **Emulator UI** → http://localhost:4000

### 3. Run Frontend in Dev Mode

In another terminal:

```bash
cd frontend
cp .env.local .env
npm start
```

Frontend will run on http://localhost:3000

### 4. Test the Application

- Register a new user
- Create test policies
- Submit claims
- Test fraud detection
- Verify settlement calculations

---

## 🚀 Production Deployment

### Step 1: Login to Firebase

```bash
firebase login
```

### Step 2: Initialize Firebase (if not done)

```bash
firebase init
```

Select:
- **Hosting**: Configure files for Firebase Hosting
- **Functions**: Configure Cloud Functions
- **Firestore**: Deploy Firestore rules and indexes
- **Storage**: Deploy Cloud Storage security rules

### Step 3: Build Frontend

```bash
cd frontend
npm run build
```

This creates optimized production build in `frontend/build/`

### Step 4: Deploy Everything

From project root:

```bash
# Deploy all services (hosting, functions, firestore, storage)
firebase deploy
```

Or deploy individually:

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only firestore rules
firebase deploy --only firestore:rules

# Deploy only storage rules
firebase deploy --only storage
```

### Step 5: Get Deployed URLs

After deployment, you'll see:

```
✔  Deploy complete!

Hosting URL: https://policysecure-app.web.app
Functions URL: https://us-central1-policysecure-app.cloudfunctions.net/api
```

### Step 6: Update Frontend API URL

Update `frontend/.env.prod` with the actual Functions URL, then rebuild and redeploy:

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

---

## 📦 Project Structure After Setup

```
policysecure/
│
├── .firebaserc                 # Firebase project config
├── firebase.json               # Firebase hosting/functions config
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── storage.rules              # Storage security rules
│
├── frontend/
│   ├── .env.local            # Local development env
│   ├── .env.prod             # Production env
│   ├── build/                # Production build (generated)
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.js   # Firebase SDK config
│   │   └── ...
│   └── package.json
│
└── functions/
    ├── index.js              # Main Cloud Functions entry
    ├── package.json          # Functions dependencies
    ├── .eslintrc.json        # ESLint config
    ├── middleware/
    │   └── auth.js           # Authentication middleware
    ├── routes/
    │   ├── auth.js           # Auth endpoints
    │   ├── claims.js         # Claims endpoints
    │   ├── policies.js       # Policies endpoints
    │   ├── fraud.js          # Fraud detection endpoints
    │   ├── settlement.js     # Settlement endpoints
    │   └── analytics.js      # Analytics endpoints
    └── services/
        └── gemini.js         # Google Gemini AI service
```

---

## 🔐 Security Configuration

### Firestore Rules

Already configured in `firestore.rules`. Rules enforce:
- Users can only read/write their own data
- Claims officers can manage claims
- Fraud investigators can access fraud reports
- Admins have full access
- Role-based access control

### Storage Rules

Already configured in `storage.rules`. Rules enforce:
- File size limits (10MB for images, 25MB for documents)
- File type validation
- User ownership verification
- Role-based access for viewing documents

### Cloud Functions Security

- All endpoints require authentication (Bearer token)
- Role-based middleware protects sensitive operations
- Input validation on all requests
- Error handling prevents information leakage

---

## 📊 Post-Deployment Tasks

### 1. Create Admin User

You can create an admin user via Firebase Console or Cloud Functions:

```javascript
// Use Firebase Console → Authentication → Add user manually
// Then update Firestore:
// users/{userId}
{
  "email": "admin@policysecure.com",
  "full_name": "Admin User",
  "role": "admin",
  "active": true,
  "createdAt": "timestamp"
}
```

### 2. Seed Initial Data (Optional)

Create test policies and users for demo purposes.

### 3. Monitor Application

- **Firebase Console** → Functions → Logs
- **Firebase Console** → Firestore → Usage
- **Firebase Console** → Hosting → Usage

### 4. Set Up Monitoring & Alerts

1. Go to **Firebase Console** → **Performance**
2. Enable performance monitoring
3. Set up alerts for:
   - High error rates
   - Slow API responses
   - Storage quota exceeded

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Firebase project not found"
```bash
# Update .firebaserc with correct project ID
firebase use your-project-id
```

#### 2. "Permission denied" during deployment
```bash
# Re-authenticate
firebase logout
firebase login
```

#### 3. Functions not deploying
```bash
# Check Node version (must be 18)
node --version

# Clear functions cache
cd functions
rm -rf node_modules
npm install
```

#### 4. CORS errors
- Ensure functions use `cors({ origin: true })`
- Check frontend `.env` has correct API URL

#### 5. Authentication errors
- Verify Firebase config in frontend
- Check if Email/Password is enabled in Firebase Console
- Ensure custom claims are set for role-based access

#### 6. Build errors
```bash
# Clear caches
cd frontend
rm -rf node_modules build
npm install
npm run build
```

---

## 📱 Testing Deployment

### 1. Health Check

```bash
curl https://us-central1-policysecure-app.cloudfunctions.net/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "PolicySecure API",
  "timestamp": "2026-03-05T..."
}
```

### 2. Test Authentication

1. Visit your hosting URL
2. Register a new user
3. Login
4. Create a claim
5. Test all features

---

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build Frontend
        run: |
          cd frontend
          npm run build
      
      - name: Install Functions Dependencies
        run: |
          cd functions
          npm ci
      
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Generate token:
```bash
firebase login:ci
```

Add token to GitHub Secrets as `FIREBASE_TOKEN`.

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

## 💡 Cost Estimation

### Free Tier Includes:
- **Hosting**: 10 GB storage, 360 MB/day transfer
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Functions**: 125K invocations/month, 40K GB-seconds, 40K CPU-seconds
- **Storage**: 5 GB storage, 1 GB/day downloads
- **Authentication**: Unlimited

### Estimated Monthly Cost (Small App):
- **~$0-25/month** for small user base (<1000 users)
- **~$25-100/month** for medium user base (1000-10000 users)

Monitor usage in Firebase Console → Usage and billing.

---

## ✅ Deployment Checklist

- [ ] Firebase project created
- [ ] All Firebase services enabled
- [ ] Environment variables configured
- [ ] Gemini API key set
- [ ] Frontend built successfully
- [ ] Functions deployed
- [ ] Hosting deployed
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Admin user created
- [ ] Application tested end-to-end
- [ ] Monitoring and alerts configured
- [ ] Domain configured (optional)
- [ ] SSL certificate active (automatic with Firebase)

---

## 🎉 Success!

Your PolicySecure application is now live on Firebase!

**Next Steps:**
1. Share the hosting URL with users
2. Monitor logs and performance
3. Gather feedback
4. Iterate and improve

For support, refer to the main project README or open an issue on GitHub.

---

**Happy Deploying! 🚀**
