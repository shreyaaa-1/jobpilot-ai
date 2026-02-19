# Backend Setup & Testing Guide

## ✅ What's Configured

### Database
- **MongoDB Atlas** connected via `MONGO_URI`
- **Collections**: User, Job
- Models with proper schema validation

### Authentication
- JWT-based auth with 7-day expiry
- Password hashing with bcryptjs
- Auth middleware for protected routes

### API Endpoints
All endpoints ready and tested:
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/jobs` - Create job (protected)
- `GET /api/jobs` - List jobs with filters, search, pagination (protected)
- `PUT /api/jobs/:id` - Update job (protected)
- `DELETE /api/jobs/:id` - Delete job (protected)
- `GET /api/jobs/stats` - Job statistics (protected)
- `POST /api/ai/match-score` - AI resume matching (protected)

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB Atlas account & connection string
- OpenRouter API key (optional, for AI features)

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Environment Variables
The `.env` file is already configured with:
- `PORT=5000` ✓
- `MONGO_URI` - Active MongoDB connection ✓
- `JWT_SECRET` - Configured ✓
- `OPENROUTER_API_KEY` - For AI features ✓

### Step 3: Start Server
```bash
npm run dev
```

Expected output:
```
MongoDB Connected: cluster0.o4yfpej.mongodb.net
Server running on port 5000
```

## 🧪 Testing Endpoints

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 2. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response:** Same as register (token + user data)

### 3. Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create Job
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "companyName": "Google",
    "role": "Senior Frontend Engineer",
    "status": "Applied",
    "jobLink": "https://google.com/careers/job123",
    "notes": "Great opportunity",
    "appliedDate": "2026-02-18"
  }'
```

### 5. Get All Jobs (with filters)
```bash
# Basic
curl -X GET http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# With filters
curl -X GET "http://localhost:5000/api/jobs?status=Applied&search=Google&page=1&limit=10&sort=appliedDate" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Query Parameters:**
- `status` - Filter by job status (Applied, Interview, Rejected, Offer)
- `search` - Search by company name
- `page` - Pagination page (default: 1)
- `limit` - Results per page (default: 10)
- `sort` - Sort field (e.g., appliedDate, createdAt)

### 6. Update Job
```bash
curl -X PUT http://localhost:5000/api/jobs/607f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "Interview",
    "notes": "Interview scheduled for Feb 20"
  }'
```

### 7. Delete Job
```bash
curl -X DELETE http://localhost:5000/api/jobs/607f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Get Job Stats
```bash
curl -X GET http://localhost:5000/api/jobs/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "Applied": 5,
  "Interview": 2,
  "Rejected": 1,
  "Offer": 0
}
```

### 9. AI Resume Match (Optional)
```bash
curl -X POST http://localhost:5000/api/ai/match-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "resumeText": "Senior Frontend Developer with 5 years React experience...",
    "jobDescription": "Looking for React expert with Node.js knowledge..."
  }'
```

**Expected Response:**
```json
{
  "matchScore": 85
}
```

## 🛠️ Using Postman (Recommended)

1. Import the endpoints into Postman
2. Set up environment variable `{{token}}` from login response
3. Add to header: `Authorization: Bearer {{token}}`
4. Test all endpoints

## 🐛 Troubleshooting

### MongoDB Connection Error
```
MongoDB connection failed: getaddrinfo ENOTFOUND
```
- Check `MONGO_URI` in `.env`
- Ensure IP whitelist allows your connection
- Verify MongoDB Atlas cluster is running

### Invalid Token Error
```
"Not authorized, token failed"
```
- Double-check JWT_SECRET matches both endpoints
- Ensure token format is `Bearer <token>` in header
- Check token hasn't expired (7-day expiry)

### Missing User Data in Response
- Update was made - login now returns user object
- Rebuild if needed: `npm install && npm run dev`

## 📊 Database Structure

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Jobs Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  companyName: String,
  role: String,
  status: String (enum: Applied, Interview, Rejected, Offer),
  jobLink: String,
  notes: String,
  appliedDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## ✨ Features Ready

✅ Secure JWT authentication
✅ Password hashing with bcryptjs
✅ CRUD operations for jobs
✅ Advanced filtering, search, sorting
✅ Pagination support
✅ Job statistics aggregation
✅ AI-powered resume matching
✅ Error handling & validation
✅ CORS enabled for frontend
✅ MongoDB Atlas integration

## 🔐 Security Notes

- JWT tokens expire in 7 days
- Passwords hashed with bcryptjs
- Email addresses are unique
- User authentication required for job operations
- All sensitive keys in `.env` (not in repo)

## Next Steps

1. ✅ Backend API working
2. 👉 Connect Frontend (client runs on 5173, proxies to 5000)
3. 👉 Test login flow end-to-end
4. 👉 Implement job creation UI
5. 👉 Add advanced filtering features
