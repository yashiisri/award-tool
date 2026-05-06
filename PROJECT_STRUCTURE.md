# KPMG Award Management Tool - Project Structure

## 📁 Complete Directory Structure

```
kpmg-award-tool/
│
├── backend/                          # FastAPI Backend
│   ├── routes/                       # API Route Handlers
│   │   ├── __init__.py
│   │   ├── auth.py                   # Authentication endpoints
│   │   ├── admin.py                  # Admin-specific endpoints
│   │   ├── jury.py                   # Jury-specific endpoints
│   │   ├── head_jury.py              # Head Jury endpoints
│   │   └── audit.py                  # Audit trail endpoints
│   │
│   ├── main.py                       # FastAPI application entry
│   ├── database.py                   # MongoDB connection
│   ├── config.py                     # Configuration management
│   ├── auth.py                       # JWT authentication logic
│   ├── models.py                     # Pydantic data models
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Environment variables (create this)
│   └── .env.example                  # Environment template
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              # API client configuration
│   │   │
│   │   ├── components/               # Reusable components
│   │   │   ├── admin/
│   │   │   │   ├── Categories.jsx
│   │   │   │   ├── Nominees.jsx
│   │   │   │   ├── VoteControl.jsx
│   │   │   │   └── AuditTrail.jsx
│   │   │   │
│   │   │   ├── jury/
│   │   │   │   ├── ValidateNominees.jsx
│   │   │   │   └── Voting.jsx
│   │   │   │
│   │   │   └── headjury/
│   │   │       ├── Categories.jsx
│   │   │       ├── Nominees.jsx
│   │   │       ├── JuryComments.jsx
│   │   │       └── VoteStatus.jsx
│   │   │
│   │   ├── pages/                    # Page components
│   │   │   ├── Landing.jsx           # Landing page
│   │   │   ├── RoleLogin.jsx         # Role-based login
│   │   │   ├── RoleRegister.jsx      # Role-based registration
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── JuryDashboard.jsx
│   │   │   └── HeadJuryDashboard.jsx
│   │   │
│   │   ├── App.jsx                   # Main app component
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # Global styles
│   │
│   ├── index.html                    # HTML template
│   ├── package.json                  # Node dependencies
│   ├── vite.config.js                # Vite configuration
│   ├── tailwind.config.js            # TailwindCSS config
│   └── postcss.config.js             # PostCSS config
│
├── .gitignore                        # Git ignore rules
├── README.md                         # Project overview
├── SETUP_GUIDE.md                    # Detailed setup instructions
└── PROJECT_STRUCTURE.md              # This file
```

---

## 🎯 Key Features by Role

### 🛡️ Admin Portal
**Route:** `/admin/*`

**Pages:**
- `/admin/categories` - Create and manage award categories
- `/admin/nominees` - Add nominees from rationale data
- `/admin/vote-control` - Enable/disable voting periods
- `/admin/audit` - Complete system audit trail

**Capabilities:**
- Create award categories
- Add nominees with rationale data
- Red flag nominees (with reason)
- Control voting periods per category
- Control nomination periods per category
- View complete audit trail
- Full system oversight

---

### 👑 Head Jury Portal
**Route:** `/head_jury/*`

**Pages:**
- `/head_jury/categories` - Create award categories
- `/head_jury/nominees` - Validate nominees
- `/head_jury/comments` - View all jury comments
- `/head_jury/vote-status` - Monitor voting progress
- `/head_jury/audit` - View audit trail

**Capabilities:**
- Create award categories
- Validate nominees
- Red flag nominees (with reason)
- View all jury comments and feedback
- Monitor vote status across all categories
- Access audit trail
- Strategic oversight

---

### 👥 Jury Portal
**Route:** `/jury/*`

**Pages:**
- `/jury/validate` - Validate nominees
- `/jury/voting` - Vote and score nominees

**Capabilities:**
- Validate nominees (add to validated list)
- Vote on nominees (1-5 star rating)
- Add comments on nominees
- View nominees by category
- Participate in decision-making

---

## 🔐 Authentication Flow

### Registration Flow
1. User lands on homepage (`/`)
2. Clicks on role card (Admin/Head Jury/Jury)
3. Redirected to role-specific registration (`/register/:role`)
4. Fills registration form
5. Account created with specified role
6. Redirected to role-specific login

### Login Flow
1. User navigates to role-specific login (`/login/:role`)
2. Enters credentials
3. Backend validates credentials and role match
4. JWT token issued
5. Redirected to role-specific dashboard

### Protected Routes
- All dashboard routes require authentication
- Role-based access control enforced
- Invalid role redirects to appropriate login

---

## 🗄️ Database Schema

### Collections

#### `users`
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  role: String,  // "admin" | "jury" | "head_jury"
  hashed_password: String,
  created_at: DateTime
}
```

#### `categories`
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  created_by: String,  // username
  created_at: DateTime
}
```

#### `nominees`
```javascript
{
  _id: ObjectId,
  name: String,
  category_id: String,
  rationale_data: Object,
  validated_by: [String],  // array of usernames
  red_flagged: Boolean,
  red_flag_reason: String,
  red_flagged_by: String,
  created_at: DateTime
}
```

#### `votes`
```javascript
{
  _id: ObjectId,
  nominee_id: String,
  jury_id: String,
  category_id: String,
  score: Number,  // 1-5
  created_at: DateTime
}
```

#### `comments`
```javascript
{
  _id: ObjectId,
  nominee_id: String,
  jury_id: String,
  comment: String,
  created_at: DateTime
}
```

#### `vote_controls`
```javascript
{
  _id: ObjectId,
  category_id: String,
  voting_enabled: Boolean,
  nomination_enabled: Boolean,
  updated_by: String,
  updated_at: DateTime
}
```

#### `audit_logs`
```javascript
{
  _id: ObjectId,
  user_id: String,
  user_role: String,
  action: String,
  details: Object,
  timestamp: DateTime
}
```

---

## 🎨 Design System

### Color Palette (KPMG Brand)
```css
--kpmg-blue: #00338D      /* Primary brand color */
--kpmg-lightblue: #0091DA /* Secondary brand color */
--kpmg-purple: #7F3F98    /* Accent color */
--kpmg-gray: #60656F      /* Text color */
```

### Typography
- Font Family: System fonts (Apple, Segoe UI, Roboto)
- Headings: Bold, 2xl-6xl
- Body: Regular, base-lg

### Components
- Rounded corners: 8px-16px
- Shadows: Soft, layered
- Transitions: 200-300ms ease
- Hover effects: Scale, shadow, color

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Admin
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `POST /api/admin/nominees` - Add nominee
- `POST /api/admin/vote-control` - Update vote control
- `POST /api/admin/red-flag` - Red flag nominee

### Jury
- `POST /api/jury/validate-nominee` - Validate nominee
- `POST /api/jury/vote` - Vote on nominee
- `POST /api/jury/comment` - Add comment
- `GET /api/jury/nominees/:category_id` - Get nominees

### Head Jury
- `POST /api/head-jury/categories` - Create category
- `POST /api/head-jury/validate-nominee` - Validate nominee
- `GET /api/head-jury/jury-comments` - Get all comments
- `GET /api/head-jury/vote-status` - Get vote status
- `GET /api/head-jury/nominees` - Get all nominees

### Audit
- `GET /api/audit/logs` - Get audit trail

---

## 🚀 Deployment Architecture

### Recommended Stack

**Frontend:**
- Vercel / Netlify
- CDN: Cloudflare
- Domain: Custom KPMG domain

**Backend:**
- Railway / Render / AWS
- Load Balancer: AWS ALB / Nginx
- SSL: Let's Encrypt / AWS Certificate Manager

**Database:**
- MongoDB Atlas (M10+ for production)
- Backup: Automated daily snapshots
- Monitoring: MongoDB Atlas monitoring

**Monitoring:**
- Sentry (Error tracking)
- LogRocket (Session replay)
- Google Analytics (Usage analytics)

---

## 📊 Enterprise Features

### Security
- ✅ JWT authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing (bcrypt)
- ✅ CORS protection
- ✅ Input validation (Pydantic)
- ✅ SQL injection prevention (MongoDB)

### Audit & Compliance
- ✅ Complete audit trail
- ✅ User action logging
- ✅ Timestamp tracking
- ✅ Role-based logging

### Performance
- ✅ Async database operations (Motor)
- ✅ Connection pooling
- ✅ Lazy loading
- ✅ Code splitting (Vite)

### Scalability
- ✅ Stateless backend (JWT)
- ✅ Horizontal scaling ready
- ✅ Database indexing ready
- ✅ CDN-ready frontend

---

## 🧪 Testing Strategy

### Backend Testing
```bash
pytest tests/
```

### Frontend Testing
```bash
npm run test
```

### E2E Testing
- Playwright / Cypress
- Test user flows
- Test role permissions

---

## 📈 Future Enhancements

### Phase 2
- [ ] AI-powered search engine
- [ ] Email notifications
- [ ] Real-time updates (WebSocket)
- [ ] Export reports (PDF/Excel)
- [ ] Advanced analytics dashboard

### Phase 3
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced filtering
- [ ] Bulk operations
- [ ] Integration APIs

---

## 📞 Support & Maintenance

### Logs Location
- Backend: Terminal output
- Frontend: Browser console (F12)
- Database: MongoDB Atlas logs

### Common Issues
See `SETUP_GUIDE.md` troubleshooting section

---

**Built with ❤️ for KPMG Internship Project**
