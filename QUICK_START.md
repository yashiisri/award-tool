# ⚡ Quick Start Guide - KPMG Award Management Tool

## 🎯 Get Running in 5 Minutes!

### Step 1: MongoDB Atlas Setup (2 minutes)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select cloud provider and region
   - Click "Create"

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/`

4. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `kpmg_user`
   - Password: Generate secure password
   - Save credentials!

5. **Allow Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Confirm

---

### Step 2: Backend Setup (1 minute)

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux
```

**Edit `.env` file:**
```env
MONGODB_URL=mongodb+srv://kpmg_user:YOUR_PASSWORD@cluster.mongodb.net/
DATABASE_NAME=kpmg_awards
SECRET_KEY=super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Start backend:**
```bash
uvicorn main:app --reload
```

✅ Backend running at: http://localhost:8000

---

### Step 3: Frontend Setup (1 minute)

Open **NEW terminal** (keep backend running):

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend running at: http://localhost:5173

---

### Step 4: Create Your First Account (1 minute)

1. **Open Browser**
   - Go to: http://localhost:5173

2. **Register Admin Account**
   - Click on "Admin" card
   - Click "Register here"
   - Fill form:
     - Username: `admin`
     - Email: `admin@kpmg.com`
     - Password: `admin123`
     - Confirm Password: `admin123`
   - Click "Create Account"

3. **Login**
   - You'll be redirected to login
   - Enter credentials
   - Click "Sign In"

4. **Explore Dashboard**
   - You're now in the Admin Dashboard!
   - Try creating a category
   - Add some nominees

---

## 🎉 You're All Set!

### What to Try Next:

1. **Create Award Categories**
   - Go to "Award Categories"
   - Click "Create Category"
   - Name: "Best Innovation"
   - Description: "For outstanding innovation"

2. **Add Nominees**
   - Go to "Nominees"
   - Click "Add Nominee"
   - Fill in details

3. **Register Other Roles**
   - Logout (bottom left)
   - Go back to home
   - Register Head Jury account
   - Register Jury account

4. **Test Voting Flow**
   - Login as Admin
   - Enable voting for a category (Vote Control)
   - Login as Jury
   - Vote on nominees!

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error: "No module named 'fastapi'"**
```bash
pip install -r requirements.txt
```

**Error: "Connection refused"**
- Check MongoDB connection string in `.env`
- Verify username/password
- Check Network Access in MongoDB Atlas

### Frontend Won't Start

**Error: "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error: "Port already in use"**
```bash
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

### Can't Login

**"Invalid credentials"**
- Make sure you registered first
- Check username/password spelling
- Try registering again with different username

**"Network Error"**
- Make sure backend is running (http://localhost:8000)
- Check browser console (F12) for errors

---

## 📱 Test Accounts

Create these for testing:

**Admin:**
- Username: `admin`
- Password: `admin123`
- Role: Admin

**Head Jury:**
- Username: `headjury`
- Password: `headjury123`
- Role: Head Jury

**Jury:**
- Username: `jury1`
- Password: `jury123`
- Role: Jury

---

## 🔗 Important URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MongoDB Atlas**: https://cloud.mongodb.com

---

## 📚 Next Steps

1. Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup
2. Check [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for architecture
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
4. See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

---

## 💡 Pro Tips

1. **Keep Both Terminals Open**
   - One for backend
   - One for frontend

2. **Check Logs**
   - Backend: Terminal output
   - Frontend: Browser console (F12)

3. **Test All Roles**
   - Create accounts for all three roles
   - Test the complete workflow

4. **Use API Docs**
   - Visit http://localhost:8000/docs
   - Test API endpoints directly

5. **MongoDB Compass**
   - Download MongoDB Compass
   - Connect to view your data visually

---

## 🆘 Need Help?

1. Check error messages in terminal
2. Check browser console (F12)
3. Review troubleshooting section above
4. Check MongoDB Atlas connection
5. Verify all dependencies installed

---

## ✅ Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Admin account created
- [ ] Can login successfully
- [ ] Can create categories
- [ ] Can add nominees
- [ ] Head Jury account created
- [ ] Jury account created
- [ ] Tested voting flow

---

**Happy Building! 🚀**

Your KPMG Award Management Tool is ready to use!
