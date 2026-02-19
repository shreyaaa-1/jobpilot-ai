# JobPilot AI - Full Stack Startup Guide

## 🎯 Quick Start (Copy-Paste)

### Terminal 1: Backend
```bash
cd server
npm run dev
# Expected: "Server running on port 5000"
```

### Terminal 2: Frontend  
```bash
cd client
npm run dev
# Expected: "VITE v5.0.0 ready in XXX ms"
# Open: http://localhost:5173
```

## ✅ Pre-Flight Checks

Run these to ensure everything is set up:

### 1. Backend Check
```bash
cd server
node -e "console.log('Node:', process.version); require('dotenv').config(); console.log('MongoDB URI:', process.env.MONGO_URI ? '✓ Configured' : '✗ Missing')"
```

### 2. Frontend Check
```bash
cd client
npm list react react-router-dom axios @tanstack/react-query
```

### 3. MongoDB Atlas Check
Visit: https://cloud.mongodb.com/
- Verify cluster is running
- Check Network Access allows your IP

## 🔐 Complete Login Flow (Step by Step)

### Step 1: Register on Frontend
1. Open `http://localhost:5173`
2. Click "Sign up"
3. Fill form:
   - Name: John Doe
   - Email: john@test.com
   - Password: Password123
   - Confirm: Password123
4. Click "Create account"
5. Check toast notification ✓

### Step 2: Verify in Backend
```bash
# Check console output
# Should show: POST /api/auth/register 201 (Created)
```

### Step 3: Verify in Database
Visit MongoDB Atlas → Collections → jobpilot → users
You should see your new user document

### Step 4: Test Login
1. Go back to `http://localhost:5173/login`
2. Enter credentials
3. Click "Sign in"
4. Should redirect to dashboard ✓

### Step 5: Check Token Storage
Open DevTools (F12) → Application → Local Storage
You should see:
```
token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
user: {"_id":"...","name":"John Doe","email":"john@test.com"}
```

## 📊 Testing Job Operations

### Create Job (via Frontend)
1. On Dashboard, look for "Add Job" button (we'll build this next)
2. For now, use curl:

```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "companyName": "Meta",
    "role": "React Developer",
    "status": "Applied",
    "jobLink": "https://meta.com/careers",
    "notes": "Applied on Feb 18",
    "appliedDate": "2026-02-18"
  }'
```

### View Jobs
1. Click "Jobs" in sidebar
2. Should load your jobs (or empty state)
3. Backend log shows: `GET /api/jobs 200`

## 🐛 Common Issues & Fixes

### Issue: "CORS error"
**Fix:**
```bash
# Backend has CORS enabled
# If still issues, try hard refresh:
# Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Issue: "MongoDB connection failed"
**Fix:**
1. Check `.env` MONGO_URI
2. Visit MongoDB Atlas → Network Access
3. Add your IP address to whitelist
4. Restart server

### Issue: "Not authorized, token failed"
**Fix:**
1. Check JWT_SECRET matches
2. Clear localStorage: DevTools → Application → Clear
3. Login again
4. Copy exact token from response

### Issue: Login returns "User already exists"
**Fix:**
```bash
# Use different email or clear DB:
# MongoDB Atlas → Collections → Drop user collection
# Then register with new email
```

## 🚀 API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/auth/register | ✗ | Create account |
| POST | /api/auth/login | ✗ | Login |
| GET | /api/auth/me | ✓ | Current user |
| POST | /api/jobs | ✓ | Create job |
| GET | /api/jobs | ✓ | List jobs |
| GET | /api/jobs/stats | ✓ | Job statistics |
| PUT | /api/jobs/:id | ✓ | Update job |
| DELETE | /api/jobs/:id | ✓ | Delete job |
| POST | /api/ai/match-score | ✓ | AI matching |

## 📱 Frontend Status

### ✅ Built & Ready
- Login/Signup pages
- Dashboard with charts
- Job listing page
- Job detail page
- Protected routes
- Dark/light theme
- Toast notifications
- Form validation
- Responsive design

### 🚧 Coming Next
- Job creation form
- Job editing form
- Advanced filtering UI
- Search functionality
- Pagination UI
- Job statistics visualization

## 🗂️ File Structure Overview

```
jobpilot-ai/
├── server/                      # Express backend
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # User, Job schemas
│   ├── controllers/            # Business logic
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Auth, validation
│   ├── .env                    # Configuration (keys)
│   ├── .env.example            # Template
│   └── server.js               # App entry
│
└── client/                      # React frontend
    ├── src/
    │   ├── api/               # Axios, React Query
    │   ├── context/           # Auth, Theme state
    │   ├── components/        # Reusable UI
    │   ├── pages/            # Route pages
    │   ├── utils/            # Validation schemas
    │   ├── App.jsx           # Router setup
    │   └── main.jsx          # Entry point
    ├── .env                  # Frontend config
    ├── vite.config.js       # Vite build config
    └── index.html           # HTML template
```

## 💡 Pro Tips

### Real-time Backend Logs
The frontend calls will show in backend terminal:
```
GET /api/jobs 200 +5ms          # User fetches job list
POST /api/jobs 201 +12ms        # User creates job
PUT /api/jobs/123 200 +8ms      # User updates job
```

### Debug Network Requests
DevTools → Network tab → See all API calls
- Filter by XHR
- Check response payloads
- Verify status codes

### Access MongoDB Data
```
MongoDB Atlas → Browse Collections → Select Database/Collection
```

### Test API Directly
Use Postman or VS Code REST Client:
```rest
@baseUrl = http://localhost:5000/api
@token = YOUR_TOKEN_HERE

### Register
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}

### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### Get Jobs
GET {{baseUrl}}/jobs
Authorization: Bearer {{token}}
```

## ⚡ Performance Notes

- Frontend build: ~2-3s (Vite)
- Backend startup: ~1-2s (MongoDB connection)
- First API call: ~500-1000ms (cold start)
- Subsequent calls: ~50-200ms

## ✨ Next Implementation Priority

1. **Job Creation Form** - Add/Edit UI for jobs
2. **Advanced Filtering** - Status, date range, salary filters
3. **Search Bar** - Full-text search across jobs
4. **Pagination** - Handle large job lists
5. **Analytics** - Connect dashboard to real data
6. **AI Features** - Resume matching interface
7. **Deployment** - Vercel (frontend) + Render (backend)

## 🆘 Need Help?

Check these first:
1. Backend running? `npm run dev` in /server
2. Frontend running? `npm run dev` in /client
3. MongoDB connected? Check `.env` and Atlas whitelist
4. JWT_SECRET configured? Check both .env files
5. Token in header? Should be `Authorization: Bearer <token>`

---

**Ready to test?** Start with quick start above! 🚀
