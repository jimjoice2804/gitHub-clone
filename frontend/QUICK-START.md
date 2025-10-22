# 🚀 Quick Start Guide - Phase 2

## Start Your GitHub Clone App

### Terminal 1 - Backend (Port 3001)

```bash
cd /Users/jimmykerketta/Desktop/MyFiles/Code/gitHub-clone
npm run dev
```

### Terminal 2 - Frontend (Port 3000)

```bash
cd /Users/jimmykerketta/Desktop/MyFiles/Code/gitHub-clone/frontend
npm run dev
```

### Access the App

Open your browser: **http://localhost:3000**

## 🧪 Test the Authentication

### 1. Register New Account

- Click "Get Started"
- Username: `testuser`
- Email: `test@example.com`
- Password: `Test1234`
- Confirm Password: `Test1234`
- Click "Create account"

### 2. View Dashboard

- After registration, you'll see the dashboard
- Your user info will be displayed
- Click "Logout" to sign out

### 3. Login

- Click "Sign In"
- Email: `test@example.com`
- Password: `Test1234`
- Click "Sign in"

## ✅ What Works Now

- ✅ User registration with validation
- ✅ User login with JWT authentication
- ✅ Protected dashboard route
- ✅ Automatic redirects
- ✅ Toast notifications
- ✅ Form validation with error messages
- ✅ Loading states
- ✅ Logout functionality

## 🔍 Check the Console

Open browser DevTools (F12) to see:

- API requests to `http://localhost:3001/api`
- JWT token storage in localStorage
- React Query cache updates
- Authentication state changes

## 📱 Pages Available

| Route        | Description    | Auth Required                   |
| ------------ | -------------- | ------------------------------- |
| `/`          | Landing page   | No                              |
| `/login`     | Login page     | No (redirects if authenticated) |
| `/register`  | Register page  | No (redirects if authenticated) |
| `/dashboard` | User dashboard | Yes (redirects to login if not) |

## 🎨 UI Components Available

- Button (primary, outline, variants)
- Input (text, email, password)
- Card (header, content, footer)
- Label (form labels)
- Form (validation wrapper)
- Toast notifications

## 🐛 Troubleshooting

### Backend Not Running?

```bash
cd /Users/jimmykerketta/Desktop/MyFiles/Code/gitHub-clone
npm install
npm run dev
```

### Frontend Not Running?

```bash
cd /Users/jimmykerketta/Desktop/MyFiles/Code/gitHub-clone/frontend
npm install
npm run dev
```

### Can't Login?

- Check backend is running on port 3001
- Check `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- Check browser console for errors
- Make sure you registered an account first

### Database Issues?

```bash
cd /Users/jimmykerketta/Desktop/MyFiles/Code/gitHub-clone
npx prisma migrate dev
npx prisma generate
```

## 📸 Expected UI

### Landing Page

- Big title: "GitHub Clone"
- Two buttons: "Get Started" and "Sign In"
- Three feature cards below

### Login Page

- Email input
- Password input
- "Sign in" button
- Link to register page

### Register Page

- Username input
- Email input
- Name input (optional)
- Password input
- Confirm password input
- "Create account" button
- Link to login page

### Dashboard

- Header with "Dashboard" title and "Logout" button
- Welcome message with username
- User info card (username, email, ID)

## 🎉 Success!

If you can register, login, see the dashboard, and logout - **Phase 2 is working perfectly!** 🎊

**Next:** Run `complete phase 3` to add navigation, header, and sidebar! 🚀
