# 📋 Quick Reference Card

## 🚀 Quick Start Commands

### Initial Setup (One-Time)
```powershell
# Backend
cd backend
.\setup.ps1
# Edit .env - add GEMINI_API_KEY
python init_db.py

# Frontend
cd ..\frontend
.\setup.ps1

# Launch
cd ..
.\start.ps1
```

### Daily Development
```powershell
# Start everything
.\start.ps1

# Or manually:
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🔗 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React application |
| Backend | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Health | http://localhost:8000/health | Health check endpoint |

## 👥 Default Users

| Role | Email | Password | Use Case |
|------|-------|----------|----------|
| Policyholder | user@example.com | user123 | Submit & track claims |
| Claims Officer | officer@insurance.com | officer123 | Review & process claims |
| Fraud Investigator | fraud@insurance.com | fraud123 | Investigate flagged claims |
| Admin | admin@insurance.com | admin123 | System administration |
| Support | support@insurance.com | support123 | Customer assistance |

## 🎯 Key Features to Demo

### Policyholder Flow
1. Login → View Dashboard
2. Check existing claims
3. View policies
4. See claim status & AI analysis

### Officer Flow
1. Login → Review Dashboard
2. View pending claims
3. See Gemini fraud scores
4. Approve/reject with remarks
5. View analytics

### Admin Flow
1. Login → Analytics Dashboard
2. View fraud trends
3. Monitor system metrics
4. Review Gemini insights

## 📁 Project Structure

```
mini-pro/
├── backend/           # FastAPI + Python
│   ├── app/
│   │   ├── api/      # Endpoints
│   │   ├── models/   # DB models
│   │   ├── services/ # Business logic + Gemini
│   │   └── core/     # Config + Security
│   ├── main.py       # FastAPI app
│   └── init_db.py    # Database setup
│
├── frontend/         # React + Tailwind
│   └── src/
│       ├── pages/    # UI pages
│       ├── components/ # Reusable UI
│       └── services/ # API calls
│
└── docs/             # Documentation
```

## 🔧 Common Commands

### Backend
```powershell
# Activate venv
cd backend
.\venv\Scripts\Activate

# Run server
uvicorn main:app --reload

# Reset database
python init_db.py

# Install new package
pip install package-name
pip freeze > requirements.txt
```

### Frontend
```powershell
# Start dev server
npm start

# Build for production
npm run build

# Install new package
npm install package-name
```

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Find process
netstat -ano | findstr :8000  # or :3000

# Kill process
taskkill /PID <PID> /F
```

### Database Issues
```powershell
# Check PostgreSQL
psql -U postgres -d insurance_claims

# Reset database
DROP DATABASE insurance_claims;
CREATE DATABASE insurance_claims;
python init_db.py
```

### Environment Variables Not Loaded
```powershell
# Backend - check .env exists
cat backend\.env

# Frontend - check .env exists
cat frontend\.env

# Restart servers after changing .env
```

### CORS Errors
- Verify backend is running on port 8000
- Check `ALLOWED_ORIGINS` in `backend/.env`
- Should include: `http://localhost:3000`

### Gemini API Errors
```
Error: 401 Unauthorized
→ Check GEMINI_API_KEY in backend/.env

Error: 429 Rate Limit
→ Wait a few minutes, API has rate limits

Error: API key invalid
→ Get new key from: https://makersuite.google.com/app/apikey
```

## 📊 Database Schema Quick Reference

### Users Table
- id, email, password, full_name, role
- Roles: policyholder, claims_officer, fraud_investigator, admin, customer_support

### Policies Table
- id, policy_number, user_id, insurance_type
- insurance_type: health, motor, property, travel, crop, personal_accident

### Claims Table
- id, claim_number, user_id, policy_id
- status: draft, submitted, under_review, approved, rejected
- fraud_risk_score (0-100), fraud_risk_level

## 🎨 UI Components

### Status Badges
- Draft → Gray
- Submitted → Blue
- Under Review → Yellow
- Approved → Green
- Rejected → Red

### Risk Levels
- LOW → Green
- MEDIUM → Yellow
- HIGH → Orange
- CRITICAL → Red

## 🔑 API Endpoints Quick Reference

### Authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register
- GET `/api/auth/me` - Current user

### Claims
- GET `/api/claims` - List claims
- POST `/api/claims` - Create claim
- GET `/api/claims/{id}` - Get claim details
- POST `/api/claims/{id}/submit` - Submit for processing
- PUT `/api/claims/{id}/review` - Officer review
- PUT `/api/claims/{id}/fraud-review` - Fraud review

### Policies
- GET `/api/policies` - List policies
- POST `/api/policies` - Create policy
- GET `/api/policies/{id}` - Get policy details

### Admin
- GET `/api/admin/analytics/overview` - System analytics
- GET `/api/admin/analytics/fraud-trends` - Fraud statistics

## 📝 Code Snippets

### Making API Call (Frontend)
```javascript
import { claimsAPI } from '../services/api';

// List claims
const claims = await claimsAPI.list();

// Get specific claim
const claim = await claimsAPI.get(claimId);

// Submit claim
const result = await claimsAPI.submit(claimId);
```

### Database Query (Backend)
```python
from app.models import Claim, ClaimStatus
from app.core.database import get_db

# Get all pending claims
pending = db.query(Claim).filter(
    Claim.status == ClaimStatus.UNDER_REVIEW
).all()
```

### Gemini API Call (Backend)
```python
from app.services import gemini_service

# Analyze fraud
result = await gemini_service.analyze_fraud_risk(
    claim_data, policy_data, user_history, signals
)

# Get settlement justification
justification = await gemini_service.generate_settlement_justification(
    claim_data, policy_data, amount
)
```

## 🎯 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads successfully
- [ ] Login works with default credentials
- [ ] Dashboard displays data
- [ ] Claims list shows claims
- [ ] Claim detail page shows AI analysis
- [ ] Gemini API key is working
- [ ] No console errors
- [ ] All pages accessible
- [ ] Role-based access working

## 📚 Documentation Files

- `README.md` - Project overview
- `SETUP_GUIDE.md` - Detailed setup steps
- `PROJECT_SUMMARY.md` - Complete feature list
- `GEMINI_INTEGRATION.md` - AI integration details
- `QUICK_REFERENCE.md` - This file

## 💡 Tips

- Use API docs at `/docs` for testing endpoints
- Check browser DevTools console for errors
- Backend logs show detailed error messages
- Demo users have pre-populated data
- Gemini responses are visible in claim details
- Admin dashboard shows overall statistics

## 🆘 Get Help

1. Check error messages (console/terminal)
2. Review documentation files
3. Verify environment variables
4. Check database connections
5. Ensure API key is valid
6. Restart servers

---

**Quick Start:** `.\start.ps1` → http://localhost:3000 → Login with `user@example.com` / `user123`
