# KPMG Award Management Tool - Setup Guide

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ and npm installed
- MongoDB Atlas account (free tier works)

---

## 📦 Backend Setup

### 1. Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### 2. Configure Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Mac/Linux
```

### 3. Edit .env File

Open `backend/.env` and update:

```env
MONGODB_URL=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/
DATABASE_NAME=kpmg_awards
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Important:** Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your actual MongoDB Atlas credentials.

### 4. Start Backend Server

```bash
uvicorn main:app --reload
```

Backend will run on: `http://localhost:8000`

---

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

## 🎯 First Time Usage

### 1. Open Your Browser
Navigate to: `http://localhost:5173`

### 2. Register Users
You'll see the landing page. Register accounts for each role:

- **Admin**: Click "Admin" → Register
- **Head Jury**: Click "Head Jury" → Register  
- **Jury**: Click "Jury" → Register

### 3. Login and Explore
After registration, login with your credentials and explore the dashboard!

---

## 🔐 Default Test Accounts (Optional)

You can create these manually via registration:

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Role: Admin

**Head Jury Account:**
- Username: `headjury`
- Password: `headjury123`
- Role: Head Jury

**Jury Account:**
- Username: `jury1`
- Password: `jury123`
- Role: Jury

---

## 🛠️ Troubleshooting

### Backend Issues

**Error: "No module named 'fastapi'"**
```bash
pip install -r requirements.txt
```

**Error: "Connection refused" or MongoDB errors**
- Check your MongoDB Atlas connection string in `.env`
- Ensure your IP is whitelisted in MongoDB Atlas (Network Access)
- Verify username/password are correct

### Frontend Issues

**Error: "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error: "Port 5173 already in use"**
```bash
# Kill the process using port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

---

## 📱 Features Overview

### Admin Portal
- ✅ Create award categories
- ✅ Add nominees from rationale data
- ✅ Control voting periods (enable/disable)
- ✅ Red flag nominees
- ✅ View complete audit trail

### Head Jury Portal
- ✅ Create award categories
- ✅ Validate nominees
- ✅ View all jury comments
- ✅ Monitor vote status
- ✅ Red flag nominees
- ✅ Access audit trail

### Jury Portal
- ✅ Validate nominees
- ✅ Vote and score nominees (1-5 stars)
- ✅ Add comments on nominees
- ✅ View nominees by category

---

## 🔒 Security Features

- 🔐 JWT-based authentication
- 🔐 Role-based access control (RBAC)
- 🔐 Password hashing with bcrypt
- 🔐 Complete audit trail logging
- 🔐 Vote control system

---

## 📊 Database Collections

The system automatically creates these MongoDB collections:

- `users` - User accounts and credentials
- `categories` - Award categories
- `nominees` - Nominee information
- `votes` - Jury votes and scores
- `comments` - Jury comments
- `vote_controls` - Voting period controls
- `audit_logs` - Complete activity audit trail

---

## 🎨 Tech Stack

**Frontend:**
- React 18
- React Router v6
- TailwindCSS
- Axios
- Lucide Icons

**Backend:**
- FastAPI
- MongoDB (Motor async driver)
- JWT Authentication
- Pydantic validation

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in browser console (F12)
3. Check backend logs in terminal

---

## 🚀 Production Deployment

### Backend (Railway/Render/Heroku)
1. Set environment variables in platform
2. Deploy from GitHub repository
3. Update CORS origins in `main.py`

### Frontend (Vercel/Netlify)
1. Update API URL in `frontend/src/api/axios.js`
2. Deploy from GitHub repository
3. Set build command: `npm run build`
4. Set output directory: `dist`

---

## ✅ Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend `.env` file configured
- [ ] Backend dependencies installed
- [ ] Backend server running on port 8000
- [ ] Frontend dependencies installed
- [ ] Frontend server running on port 5173
- [ ] Admin account registered
- [ ] Head Jury account registered
- [ ] Jury account registered
- [ ] Test creating a category
- [ ] Test adding a nominee
- [ ] Test voting system

---

**Congratulations! Your KPMG Award Management Tool is ready! 🎉**
