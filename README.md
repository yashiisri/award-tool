# 🏆 KPMG Award Management Tool

> Enterprise-grade award management platform with role-based access, intelligent workflows, and complete audit trails.

![KPMG Awards](https://img.shields.io/badge/KPMG-Awards-00338D?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)

---

## ✨ Features

### 🎯 Core Capabilities
- **Three Role-Based Portals**: Admin, Head Jury, and Jury with tailored dashboards
- **Intelligent Voting System**: Category-based voting with score tracking
- **Complete Audit Trail**: Every action logged with timestamp and user details
- **Red Flag System**: Mark and track problematic nominees
- **Vote Control**: Enable/disable voting periods per category
- **Validation Workflow**: Multi-level nominee approval process
- **Real-time Comments**: Jury feedback and collaboration

### 🔐 Enterprise Security
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Complete audit logging
- CORS protection
- Input validation

### 🎨 Modern UI/UX
- KPMG brand colors and design system
- Responsive design for all devices
- Smooth animations and transitions
- Intuitive navigation
- Professional landing page

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas account

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd kpmg-award-tool
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux

# Edit .env with your MongoDB Atlas credentials
# Then start server
uvicorn main:app --reload
```

.\venv_new\Scripts\python.exe -m uvicorn main:app --reload


### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access Application
Open browser to: `http://localhost:5173`

---

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Detailed installation and configuration
- **[Project Structure](PROJECT_STRUCTURE.md)** - Complete architecture overview
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs (when backend running)

---

## 👥 User Roles

### 🛡️ Admin
- Create award categories
- Add nominees from rationale data
- Control voting periods
- Red flag nominees
- View complete audit trail

### 👑 Head Jury
- Create award categories
- Validate nominees
- View all jury comments
- Monitor vote status
- Red flag nominees
- Access audit trail

### 👥 Jury
- Validate nominees
- Vote and score nominees (1-5 stars)
- Add comments on nominees
- View nominees by category

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router v6** - Navigation
- **TailwindCSS** - Styling
- **Axios** - API client
- **Lucide Icons** - Icon library
- **Vite** - Build tool

### Backend
- **FastAPI** - Web framework
- **MongoDB** - Database
- **Motor** - Async MongoDB driver
- **JWT** - Authentication
- **Pydantic** - Data validation
- **Bcrypt** - Password hashing

---

## 📊 Project Structure

```
kpmg-award-tool/
├── backend/              # FastAPI backend
│   ├── routes/          # API endpoints
│   ├── main.py          # App entry point
│   ├── database.py      # MongoDB connection
│   ├── auth.py          # JWT authentication
│   └── models.py        # Data models
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   └── App.jsx     # Main app
│   └── package.json
│
└── README.md
```

---

## 🎨 Screenshots

### Landing Page
Beautiful, enterprise-grade landing page with role selection

### Role-Based Dashboards
- **Admin**: Full system control
- **Head Jury**: Strategic oversight
- **Jury**: Evaluation and voting

### Key Features
- Category management
- Nominee validation
- Voting interface
- Audit trail
- Vote control

---

## 🔒 Security Features

- ✅ JWT token-based authentication
- ✅ Role-based access control
- ✅ Password hashing (bcrypt)
- ✅ Complete audit trail
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection prevention

---

## 📈 Future Enhancements

- [ ] AI-powered search engine
- [ ] Email notifications
- [ ] Real-time updates (WebSocket)
- [ ] Export reports (PDF/Excel)
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Multi-language support

---

## 🤝 Contributing

This is an internship project for KPMG. For questions or suggestions, please contact the project maintainer.

---

## 📄 License

Proprietary - KPMG Internal Use

---

## 👨‍💻 Author

**Internship Project**  
KPMG Award Management Tool  
Built with React, FastAPI, and MongoDB

---

## 🙏 Acknowledgments

- KPMG for the internship opportunity
- FastAPI for the amazing framework
- React team for the UI library
- MongoDB for the database platform

---

**Made with ❤️ for KPMG**
