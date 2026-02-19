# JobPilot AI

A full-stack MERN application to track job applications, analyze resume fit against job descriptions, and monitor progress through a professional dashboard.

## Overview

JobPilot AI helps job seekers manage applications in one place with:
- Secure authentication (JWT + optional Google OAuth)
- Job CRUD with search, filters, pagination, and sorting
- Dashboard analytics with trends and status metrics
- Job link extraction (title, company, location, description)
- Resume match analysis with score, strengths, weak points, missing skills, and improvements

## Tech Stack

### Frontend
- React + Vite
- React Router
- React Query
- Tailwind CSS
- Axios
- Recharts
- Lucide Icons

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT + bcrypt
- Multer (resume upload)
- Axios + Cheerio (job link extraction)

## Project Structure

```text
jobpilot-ai/
  client/                 # React frontend
    src/
      api/
      components/
      context/
      pages/
      utils/
  server/                 # Express backend
    controllers/
    middleware/
    models/
    routes/
```

## Core Features

- Auth
  - Register/Login with email and password
  - Google OAuth popup login flow
  - Protected routes

- Job Management
  - Add/Edit/Delete jobs
  - Status pipeline: Saved, Applied, Interview, Rejected, Offer
  - Manual apply link opening
  - Location suggestions endpoint

- Smart Extraction
  - Extract job fields from job URL
  - Source-aware parsing (Greenhouse, Lever, Workday, generic fallback)
  - Confidence score and review hint

- Resume Match
  - Upload resume (PDF/DOCX)
  - Compare with JD/link content
  - Return match score + actionable feedback

- Dashboard
  - Total applications
  - Matches (Interview + Offer)
  - Success rate
  - 6-month trend chart with month drill-down

## Local Setup

### Prerequisites
- Node.js 18+
- npm
- MongoDB Atlas connection string (or local MongoDB)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd jobpilot-ai
```

```bash
cd server
npm install
```

```bash
cd ../client
npm install
```

### 2. Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_jwt_secret>
CLIENT_URL=http://localhost:5173

# Optional Google OAuth
GOOGLE_CLIENT_ID=<google_client_id>
GOOGLE_CLIENT_SECRET=<google_client_secret>
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`

### Jobs
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `POST /api/jobs/:id/apply`
- `POST /api/jobs/extract`
- `GET /api/jobs/location-suggestions`
- `GET /api/jobs/stats`

### AI
- `POST /api/ai/match-score`
- `POST /api/ai/match-upload`

## Deployment

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

Set production env variables in both platforms:
- `CLIENT_URL` should point to deployed frontend
- `VITE_API_URL` should point to deployed backend `/api`
- Google OAuth callback URL should match deployed backend callback route

## UX Notes

- Theme supports light/dark mode with persistent preference.
- Resume analysis and dashboard cards are optimized for responsive layouts.
- Job cards and dashboard metrics are clickable for faster workflow.

## Roadmap

- Better source-specific extraction (more job boards)
- Resume PDF parsing improvements
- Email reminders
- Kanban job board
- JD-to-resume keyword highlighting

## License

MIT
