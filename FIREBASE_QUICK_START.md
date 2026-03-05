# PolicySecure - Firebase Quick Start

Get PolicySecure up and running on Firebase in minutes!

## 🚀 Quick Deploy (5 Minutes)

### Prerequisites
- Node.js v18+
- Firebase account

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name it `policysecure-app`
4. Enable Google Analytics (optional)
5. Create project

### Step 3: Enable Services
Enable in Firebase Console:
- ✅ Authentication (Email/Password)
- ✅ Firestore Database
- ✅ Storage
- ✅ Functions (upgrade to Blaze plan)

### Step 4: Get Firebase Config
1. Project Settings → General
2. Your apps → Web app
3. Copy configuration

### Step 5: Configure Environment

Update `frontend/.env.prod`:
```env
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=policysecure-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=policysecure-app
REACT_APP_FIREBASE_STORAGE_BUCKET=policysecure-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

Update `.firebaserc`:
```json
{
  "projects": {
    "default": "policysecure-app"
  }
}
```

### Step 6: Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Functions
cd ../functions
npm install
cd ..
```

### Step 7: Set Gemini API Key
```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

### Step 8: Build and Deploy
```bash
# Build frontend
cd frontend
npm run build
cd ..

# Deploy everything
firebase deploy
```

### Step 9: Update API URL
After deployment, copy the Functions URL and update `frontend/.env.prod`:
```env
REACT_APP_API_URL=https://us-central1-policysecure-app.cloudfunctions.net/api
```

Rebuild and redeploy:
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## 🎉 Done!

Your app is live at: `https://policysecure-app.web.app`

## 📝 Create Admin User

1. Go to Firebase Console → Authentication
2. Add user manually (email + password)
3. Go to Firestore → users collection
4. Add document with user's UID:
```json
{
  "email": "admin@policysecure.com",
  "full_name": "Admin User",
  "role": "admin",
  "active": true,
  "createdAt": "timestamp"
}
```

## 🧪 Test the App

1. Visit your hosting URL
2. Register a new user (policyholder)
3. Login
4. Create a test claim
5. Verify AI analysis works

## 🐛 Troubleshooting

### CORS Errors
- Check `REACT_APP_API_URL` is correct
- Verify functions deployed successfully

### Authentication Not Working
- Enable Email/Password in Firebase Console
- Check Firebase config is correct

### Functions Not Deploying
- Ensure Node.js v18 is installed
- Run `npm install` in functions directory
- Check Firebase project is on Blaze plan

## 📚 Full Documentation

See [FIREBASE_DEPLOYMENT_GUIDE.md](./FIREBASE_DEPLOYMENT_GUIDE.md) for complete instructions.

## 💡 Local Development

```bash
# Start emulators
firebase emulators:start

# In another terminal, start frontend
cd frontend
npm start
```

Visit http://localhost:3000

## 🔗 Useful Commands

```bash
# View logs
firebase functions:log

# Check deployment status
firebase deploy --only hosting --dry-run

# Rollback deployment
firebase hosting:rollback

# Open Firebase Console
firebase open
```

## 📊 Monitor Your App

- **Logs**: Firebase Console → Functions → Logs
- **Usage**: Firebase Console → Project Overview → Usage
- **Performance**: Firebase Console → Performance
- **Analytics**: Firebase Console → Analytics

---

Need help? Check the [full deployment guide](./FIREBASE_DEPLOYMENT_GUIDE.md) or open an issue.
