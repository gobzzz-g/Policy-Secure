# 🚀 Quick Start Guide - Insurance Claims Platform

## Prerequisites

Before you begin, ensure you have:
- ✅ Python 3.9 or higher
- ✅ Node.js 16 or higher  
- ✅ PostgreSQL 14 or higher
- ✅ MongoDB 6 or higher
- ✅ Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

## 📦 Installation Steps

### 1. Database Setup

#### PostgreSQL
```powershell
# Create database
psql -U postgres
CREATE DATABASE insurance_claims;
\q
```

#### MongoDB
```powershell
# Start MongoDB service (if not already running)
net start MongoDB
```

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env file with your credentials
# IMPORTANT: Add your Gemini API key to .env file
notepad .env
```

**Update .env with:**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/insurance_claims
MONGODB_URL=mongodb://localhost:27017/
SECRET_KEY=your-generated-secret-key-min-32-characters
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

```powershell
# Initialize database with sample data
python init_db.py

# Start backend server
uvicorn main:app --reload
```

Backend will run at: http://localhost:8000
API docs available at: http://localhost:8000/docs

### 3. Frontend Setup

Open a new PowerShell terminal:

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run at: http://localhost:3000

## 🎯 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@insurance.com | admin123 |
| **Claims Officer** | officer@insurance.com | officer123 |
| **Fraud Investigator** | fraud@insurance.com | fraud123 |
| **Customer Support** | support@insurance.com | support123 |
| **Policyholder** | user@example.com | user123 |

## ✨ Features to Test

### As Policyholder:
1. ✅ Login with user@example.com
2. ✅ View your policies
3. ✅ View existing claims
4. ✅ Check claim status and fraud analysis

### As Claims Officer:
1. ✅ Login with officer@insurance.com
2. ✅ View all claims
3. ✅ See AI-generated fraud scores
4. ✅ Review settlement recommendations
5. ✅ View analytics dashboard

### As Fraud Investigator:
1. ✅ Login with fraud@insurance.com
2. ✅ View flagged claims
3. ✅ See fraud detection signals
4. ✅ Review Gemini AI analysis

### As Admin:
1. ✅ Login with admin@insurance.com
2. ✅ View comprehensive analytics
3. ✅ See fraud trends
4. ✅ Manage users

## 🔧 Troubleshooting

### Backend Issues

**Port already in use:**
```powershell
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Database connection error:**
- Verify PostgreSQL is running: `pg_isready`
- Check connection string in .env
- Ensure database `insurance_claims` exists

**Gemini API errors:**
- Verify API key is correct in .env
- Check internet connection
- API has rate limits - wait if exceeded

### Frontend Issues

**Module not found:**
```powershell
# Clear cache and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

**Port 3000 in use:**
- The app will prompt to use port 3001
- Or kill the process: `netstat -ano | findstr :3000`

### Common Issues

**CORS errors:**
- Ensure backend is running
- Check ALLOWED_ORIGINS in backend/.env

**API requests failing:**
- Verify backend URL in frontend/.env
- Check browser console for errors

## 📊 Testing the AI Features

### Fraud Detection Test:
1. Submit a claim with amount close to policy limit
2. Check fraud_risk_score in response
3. View Gemini's explanation
4. See detected fraud signals

### Settlement Calculation Test:
1. View any submitted claim
2. Check recommended_settlement
3. Read Gemini's justification
4. View calculation breakdown

## 🎨 Project Structure

```
mini-pro/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration & security
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic & AI
│   ├── main.py             # FastAPI app
│   └── init_db.py          # Database setup
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context
│   │   ├── pages/          # Page components
│   │   └── services/       # API integration
│   └── package.json
│
└── README.md
```

## 🔒 Security Notes

⚠️ **IMPORTANT:**
- Never commit .env files
- Change default passwords in production
- Use strong SECRET_KEY
- Keep API keys confidential
- This is a demo - not production-ready as-is

## 📈 Next Steps

1. ✅ Explore the landing page
2. ✅ Login with different roles
3. ✅ Test claim submission flow
4. ✅ Review AI-generated fraud analysis
5. ✅ Check analytics dashboard
6. ✅ Experiment with different insurance types

## 🆘 Getting Help

**Backend logs:**
- Check terminal running uvicorn
- Enable DEBUG=True in .env for verbose logs

**Frontend logs:**
- Open browser Developer Tools (F12)
- Check Console tab

**API Testing:**
- Use http://localhost:8000/docs
- Interactive API documentation

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Backend shows: "Application startup complete"
- ✅ Frontend shows landing page
- ✅ Login works with default credentials
- ✅ Dashboard displays claims data
- ✅ No errors in browser console

## 📝 Development Tips

**Hot Reload:**
- Backend: Changes auto-reload with `--reload` flag
- Frontend: Changes auto-update (React Fast Refresh)

**Database Reset:**
```powershell
cd backend
python init_db.py  # Re-runs setup with fresh data
```

**API Testing:**
```powershell
# Use the interactive docs
start http://localhost:8000/docs
```

---

**Need help?** Check the console logs and error messages - they're designed to be helpful!

**Enjoying the platform?** Remember this is a demonstration of enterprise-grade AI-powered insurance processing! 🚀
