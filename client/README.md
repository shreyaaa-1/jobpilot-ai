# JobPilot AI - Frontend

Modern React + Vite frontend for JobPilot AI job matching platform.

## Tech Stack

- **React 18** - UI library
- **Vite** - Fast build tool
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS
- **React Query** - Server state management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - TypeScript-first schema validation
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## Project Structure

```
src/
├── api/                    # API integration
│   ├── axiosInstance.js   # Axios setup with interceptors
│   └── queries.js         # React Query hooks
├── components/            # Reusable components
│   ├── FormInputs.jsx    # Form field components
│   ├── ProtectedRoute.jsx # Auth routing
│   ├── Skeletons.jsx     # Loading skeletons
│   ├── Toast.jsx         # Notification system
│   ├── EmptyState.jsx    # Empty state component
│   └── Layout.jsx        # Main layout wrapper
├── context/              # React Context
│   ├── AuthContext.jsx   # Auth state
│   └── ThemeContext.jsx  # Dark/light mode
├── pages/                # Page components
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── DashboardPage.jsx
│   ├── JobsPage.jsx
│   ├── JobDetailPage.jsx
│   └── NotFoundPage.jsx
├── utils/               # Utilities
│   └── validation.js    # Form schemas (Zod)
├── App.jsx             # Root component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
VITE_API_URL=http://localhost:5000
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Key Features

### 🔐 Authentication
- Login & signup with email/password
- Protected routes with automatic redirects
- Token-based auth with localStorage
- Auto-logout on 401 responses

### 🎨 UI/UX
- Responsive design (mobile-first)
- Dark/light mode support
- Loading skeletons for better perceived performance
- Toast notifications for user feedback
- Form validation with Zod
- Empty states with guidance

### 📊 Data Management
- React Query for server state
- Automatic request caching & revalidation
- Optimistic updates
- Error handling & retry logic
- Loading states

### 🎯 API Integration
- Axios interceptors for auth tokens
- Centralized query hooks
- Request/response error handling
- Proxy setup for local development

## Components

### FormInputs
- `FormInput` - Text input with validation
- `FormTextarea` - Textarea field
- `FormSelect` - Select dropdown

### Utilities
- `SkeletonLoader` - Animated loading skeleton
- `CardSkeleton` - Pre-built card skeleton
- `TableSkeleton` - Table rows skeleton
- `EmptyState` - No-data placeholder

## API Hooks (React Query)

### Auth
- `useLogin()` - Login user
- `useSignup()` - Create account
- `useLogout()` - Logout user

### Jobs
- `useJobs(filters)` - List jobs
- `useJobById(id)` - Get single job
- `useCreateJob()` - Create job
- `useUpdateJob()` - Update job
- `useDeleteJob()` - Delete job

### AI
- `useAIAnalyze()` - Analyze with AI

## Form Validation Schemas

```javascript
import { loginSchema, signupSchema, jobSchema } from '@/utils/validation'

// Use with react-hook-form + zod resolver
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema)
})
```

## Dark Mode

Theme preference is automatically detected and stored in localStorage. Users can toggle with the theme button in the header.

```javascript
import { useTheme } from '@/context/ThemeContext'

const { isDark, toggleTheme } = useTheme()
```

## Environment Variables

- `VITE_API_URL` - Backend API base URL (default: `http://localhost:5000`)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting with React Router
- Lazy loading with Vite
- Image optimization ready
- CSS purging with Tailwind
- Minification & compression

## License

MIT
