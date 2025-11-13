# ProStream Auction - Real-time Auction Management System

## 🎯 Overview

ProStream Auction is a comprehensive real-time auction management system with built-in authentication, user management, and tournament-level access control.

### ✨ Features

- **Dual Authentication** - Sign in with Email/Password OR Google OAuth
- **Admin Credentials** - Pre-seeded admin account for immediate access
- **User Management** - Admin dashboard for user and role management
- **Role-Based Access Control** - Admin, Manager, and Viewer roles
- **Tournament Access Control** - Users see only assigned tournaments
- **Real-Time Updates** - Powered by Pusher
- **Image Management** - Cloudinary integration
- **Responsive Design** - Mobile-friendly interface

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud Console (for OAuth)
- Cloudinary account (optional, for images)

### Installation

1. **Clone & Install**
```bash
git clone <repo-url>
cd ProStream---Auction
npm install
```

2. **Configure Environment**
```bash
# Copy example and fill in credentials
cp .env.example .env.local
```

Required in `.env.local`:
```
MONGODB_URI=<your-mongodb-uri>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from-google-cloud>
GOOGLE_CLIENT_SECRET=<from-google-cloud>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

3. **Create Admin User**
```bash
npm run seed:admin
# Creates admin@prostream.com with password Admin123!
```

4. **Run Development Server**
```bash
npm run dev
# Opens on http://localhost:3001
```

5. **Login**
- Go to http://localhost:3001/login
- Use: `admin@prostream.com` / `Admin123!`
- Or sign in with Google

---

## 📚 Documentation

### Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Overview and quick links
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[SETUP_STATUS.md](./SETUP_STATUS.md)** - Current configuration status

### Authentication & Deployment
- **[CREDENTIALS_AUTH_GUIDE.md](./CREDENTIALS_AUTH_GUIDE.md)** - 🆕 Email/Password authentication guide
- **[PRE_DEPLOYMENT_STEPS.md](./PRE_DEPLOYMENT_STEPS.md)** - Step-by-step deployment (START HERE)
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Interactive deployment checklist

### Testing & Implementation
- **[API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)** - API endpoint testing
- **[FINAL_TESTING_SUMMARY.md](./FINAL_TESTING_SUMMARY.md)** - Testing complete summary
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical architecture

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start dev server (port 3001)
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Check for type errors
npm run build
```

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth v5 with Google OAuth
- **Real-time**: Pusher
- **Images**: Cloudinary
- **Deployment**: Vercel

### Key Components

#### Authentication
- `src/lib/auth.ts` - NextAuth configuration
- `src/lib/api-auth.ts` - API authentication middleware
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API route
- `src/app/(auth)/login/page.tsx` - Login page

#### Authorization
- `src/lib/authorization.ts` - Permission checking functions
- `middleware.ts` - Route protection
- `src/app/api/users/` - User management endpoints

#### Models
- `src/models/User.ts` - User schema with roles
- `src/models/Tournament.ts` - Tournament schema

#### UI Components
- `src/components/Navigation.tsx` - Updated with user info
- `src/components/UserManagementDashboard.tsx` - Admin dashboard
- `src/app/users/page.tsx` - User management page

---

## 🔐 Security

### Authentication
- Google OAuth 2.0 integration
- NextAuth v5 session management
- JWT token-based authentication
- Secure NEXTAUTH_SECRET generation

### Authorization
- Role-based access control (Admin/Manager/Viewer)
- Tournament-level access control
- API route protection
- Admin-only operations

### Environment
- Credentials in `.env.local` (not committed)
- Sensitive data not hardcoded
- HTTPS ready for production

---

## 📊 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to everything, manage users and roles |
| **Manager** | Can create tournaments, manage their own |
| **Viewer** | Can only view assigned tournaments |

---

## 🧪 Testing

### Automated Tests Passed
- ✅ TypeScript compilation
- ✅ API authentication enforcement
- ✅ Build verification
- ✅ No runtime errors

### Manual Testing (Browser)
1. Open http://localhost:3001
2. Click "Login" button
3. Sign in with Google
4. Verify user info in navigation
5. Test user management at `/users`
6. Test tournament access control

See [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) for detailed API testing procedures.

---

## 🚀 Deployment to Vercel

### Quick Deploy
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel
4. Deploy

### Detailed Steps
See [PRE_DEPLOYMENT_STEPS.md](./PRE_DEPLOYMENT_STEPS.md) for step-by-step instructions.

### Important for Production
- Generate NEW NEXTAUTH_SECRET
- Create NEW Google OAuth credentials
- Use production MongoDB (optional)
- Update NEXTAUTH_URL to your domain

---

## 📝 API Reference

### Authentication
- `POST /api/auth/signin` - Sign in with provider
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/session` - Get current session
- `GET /api/auth/providers` - List OAuth providers

### Tournaments (Protected)
- `GET /api/tournaments` - Get accessible tournaments (filtered by role)
- `POST /api/tournaments` - Create new tournament (auto-assigns creator)
- `GET /api/tournaments/[id]` - Get tournament (if accessible)
- `PUT /api/tournaments/[id]` - Update tournament (if owner/admin)
- `DELETE /api/tournaments/[id]` - Delete tournament (admin only)
- `PATCH /api/tournaments/[id]/status` - Update status
- `POST /api/tournaments/[id]/archive` - Archive tournament

### Users (Admin Only)
- `GET /api/users` - Get all users
- `PATCH /api/users/[id]/role` - Change user role
- `GET /api/users/[id]/tournaments` - Get user's tournaments
- `PATCH /api/users/[id]/tournaments` - Assign/unassign tournament

---

## 🐛 Troubleshooting

### Can't sign in with Google
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Verify redirect URI in Google Console
- Check `NEXTAUTH_SECRET` is set

### API returns 401
- Ensure you're logged in
- Check browser cookies
- Verify `NEXTAUTH_SECRET` in `.env.local`

### Database connection error
- Check `MONGODB_URI` is correct
- Verify MongoDB Atlas network access
- Ensure database user password is correct

### Port already in use
- Dev server uses port 3001 by default
- Or use: `npm run dev -- -p 3002`

---

## 📞 Support

For issues and questions:
1. Check relevant documentation file
2. Review [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)
3. Check browser console for errors
4. Check server logs: `npm run dev`

---

## 📄 License

[Add your license here]

---

## 🤝 Contributing

[Add contribution guidelines here]

---

**Status: ✅ Production Ready**

All components implemented, tested, and documented. Ready for deployment.

Last Updated: November 2024
