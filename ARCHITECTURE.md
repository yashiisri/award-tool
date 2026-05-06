# 🏗️ System Architecture - KPMG Award Management Tool

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Browser    │  │   Browser    │          │
│  │   (Admin)    │  │  (Head Jury) │  │    (Jury)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│                    HTTPS / REST API                              │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                            │                                      │
│  ┌─────────────────────────▼──────────────────────────┐         │
│  │         React Frontend (Vite + TailwindCSS)        │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │         │
│  │  │  Landing │  │   Login  │  │Dashboard │         │         │
│  │  │   Page   │  │ Register │  │Components│         │         │
│  │  └──────────┘  └──────────┘  └──────────┘         │         │
│  │                                                     │         │
│  │  State Management: React Hooks + LocalStorage      │         │
│  │  Routing: React Router v6                          │         │
│  │  HTTP Client: Axios                                │         │
│  └─────────────────────────────────────────────────────┘         │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    JWT Token Authentication
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│                            │                                      │
│  ┌─────────────────────────▼──────────────────────────┐         │
│  │              FastAPI Backend Server                │         │
│  │                                                     │         │
│  │  ┌──────────────────────────────────────────────┐ │         │
│  │  │         Authentication Middleware            │ │         │
│  │  │  (JWT Validation, Role Verification)         │ │         │
│  │  └──────────────────────────────────────────────┘ │         │
│  │                                                     │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │         │
│  │  │   Auth   │  │  Admin   │  │   Jury   │        │         │
│  │  │  Routes  │  │  Routes  │  │  Routes  │        │         │
│  │  └──────────┘  └──────────┘  └──────────┘        │         │
│  │                                                     │         │
│  │  ┌──────────┐  ┌──────────┐                       │         │
│  │  │Head Jury │  │  Audit   │                       │         │
│  │  │  Routes  │  │  Routes  │                       │         │
│  │  └──────────┘  └──────────┘                       │         │
│  │                                                     │         │
│  │  Business Logic: Pydantic Models + Validation     │         │
│  │  Security: JWT, Bcrypt, CORS                      │         │
│  └─────────────────────────────────────────────────────┘         │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    Motor (Async Driver)
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                       DATA LAYER                                 │
│                            │                                      │
│  ┌─────────────────────────▼──────────────────────────┐         │
│  │            MongoDB Atlas (Cloud Database)          │         │
│  │                                                     │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │         │
│  │  │  users   │  │categories│  │ nominees │        │         │
│  │  └──────────┘  └──────────┘  └──────────┘        │         │
│  │                                                     │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │         │
│  │  │  votes   │  │ comments │  │vote_ctrl │        │         │
│  │  └──────────┘  └──────────┘  └──────────┘        │         │
│  │                                                     │         │
│  │  ┌──────────┐                                      │         │
│  │  │audit_logs│                                      │         │
│  │  └──────────┘                                      │         │
│  │                                                     │         │
│  │  Features: Replication, Backups, Encryption        │         │
│  └─────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│ Client  │                │ Backend │                │Database │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │  POST /auth/register     │                          │
     ├─────────────────────────>│                          │
     │  {username, email,       │                          │
     │   password, role}        │                          │
     │                          │                          │
     │                          │  Hash password (bcrypt)  │
     │                          │                          │
     │                          │  Insert user             │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │  User created            │
     │                          │<─────────────────────────┤
     │                          │                          │
     │  201 Created             │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │  POST /auth/login        │                          │
     ├─────────────────────────>│                          │
     │  {username, password}    │                          │
     │                          │                          │
     │                          │  Find user               │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │  User data               │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │  Verify password         │
     │                          │  Generate JWT token      │
     │                          │                          │
     │  200 OK                  │                          │
     │  {token, role}           │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │  Store token in          │                          │
     │  localStorage            │                          │
     │                          │                          │
     │  GET /admin/categories   │                          │
     │  Authorization: Bearer   │                          │
     │  <token>                 │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │  Verify JWT              │
     │                          │  Check role              │
     │                          │                          │
     │                          │  Query categories        │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │  Categories data         │
     │                          │<─────────────────────────┤
     │                          │                          │
     │  200 OK                  │                          │
     │  [categories]            │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
```

---

## Voting Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Admin  │     │Head Jury│     │  Jury   │     │Database │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Create        │               │               │
     │ Category      │               │               │
     ├───────────────┼───────────────┼──────────────>│
     │               │               │               │
     │ Add           │               │               │
     │ Nominees      │               │               │
     ├───────────────┼───────────────┼──────────────>│
     │               │               │               │
     │               │ Validate      │               │
     │               │ Nominees      │               │
     │               ├───────────────┼──────────────>│
     │               │               │               │
     │               │               │ Validate      │
     │               │               │ Nominees      │
     │               │               ├──────────────>│
     │               │               │               │
     │ Enable        │               │               │
     │ Voting        │               │               │
     ├───────────────┼───────────────┼──────────────>│
     │               │               │               │
     │               │               │ Vote on       │
     │               │               │ Nominees      │
     │               │               ├──────────────>│
     │               │               │               │
     │               │               │ Add           │
     │               │               │ Comments      │
     │               │               ├──────────────>│
     │               │               │               │
     │               │ View Vote     │               │
     │               │ Status        │               │
     │               │<──────────────┼───────────────┤
     │               │               │               │
     │               │ View          │               │
     │               │ Comments      │               │
     │               │<──────────────┼───────────────┤
     │               │               │               │
     │ Disable       │               │               │
     │ Voting        │               │               │
     ├───────────────┼───────────────┼──────────────>│
     │               │               │               │
     │ View Audit    │               │               │
     │ Trail         │               │               │
     │<──────────────┼───────────────┼───────────────┤
     │               │               │               │
```

---

## Data Model Relationships

```
┌──────────────┐
│    users     │
│──────────────│
│ _id          │◄────────┐
│ username     │         │
│ email        │         │
│ role         │         │
│ password     │         │
└──────────────┘         │
                         │
                         │ created_by
                         │
┌──────────────┐         │
│ categories   │         │
│──────────────│         │
│ _id          │◄────┐   │
│ name         │     │   │
│ description  │     │   │
│ created_by   ├─────┘   │
└──────────────┘         │
       ▲                 │
       │ category_id     │
       │                 │
┌──────────────┐         │
│  nominees    │         │
│──────────────│         │
│ _id          │◄────┐   │
│ name         │     │   │
│ category_id  ├─────┘   │
│ rationale    │         │
│ validated_by │         │
│ red_flagged  │         │
│ red_flag_by  ├─────────┘
└──────────────┘
       ▲
       │ nominee_id
       │
┌──────┴───────┐     ┌──────────────┐
│    votes     │     │   comments   │
│──────────────│     │──────────────│
│ _id          │     │ _id          │
│ nominee_id   ├─────┤ nominee_id   │
│ jury_id      │     │ jury_id      │
│ category_id  │     │ comment      │
│ score        │     │ created_at   │
│ created_at   │     └──────────────┘
└──────────────┘

┌──────────────┐     ┌──────────────┐
│vote_controls │     │ audit_logs   │
│──────────────│     │──────────────│
│ _id          │     │ _id          │
│ category_id  │     │ user_id      │
│ voting_on    │     │ user_role    │
│ nomination_on│     │ action       │
│ updated_by   │     │ details      │
│ updated_at   │     │ timestamp    │
└──────────────┘     └──────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: Transport Security                            │
│  ┌────────────────────────────────────────────────┐    │
│  │  HTTPS/TLS 1.3                                 │    │
│  │  - 256-bit encryption                          │    │
│  │  - Certificate validation                      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Layer 2: Authentication                                │
│  ┌────────────────────────────────────────────────┐    │
│  │  JWT Token-Based Auth                          │    │
│  │  - HS256 algorithm                             │    │
│  │  - 30-minute expiration                        │    │
│  │  - Secure secret key                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Layer 3: Authorization                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  Role-Based Access Control (RBAC)             │    │
│  │  - Admin: Full access                          │    │
│  │  - Head Jury: Strategic access                 │    │
│  │  - Jury: Limited access                        │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Layer 4: Data Protection                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  Password Hashing (Bcrypt)                     │    │
│  │  - Salt rounds: 12                             │    │
│  │  - One-way encryption                          │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Layer 5: Input Validation                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  Pydantic Models                               │    │
│  │  - Type checking                               │    │
│  │  - Schema validation                           │    │
│  │  - SQL injection prevention                    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Layer 6: Audit & Compliance                            │
│  ┌────────────────────────────────────────────────┐    │
│  │  Complete Audit Trail                          │    │
│  │  - All actions logged                          │    │
│  │  - User tracking                               │    │
│  │  - Timestamp recording                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Production Setup                      │
└─────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Cloudflare │
                    │      CDN     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Vercel     │
                    │  (Frontend)  │
                    └──────┬───────┘
                           │
                    HTTPS REST API
                           │
                    ┌──────▼───────┐
                    │   Railway    │
                    │  (Backend)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  MongoDB     │
                    │   Atlas      │
                    └──────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Monitoring & Logging                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Sentry  │  │LogRocket │  │ MongoDB  │             │
│  │  Errors  │  │ Sessions │  │  Metrics │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling
- **Frontend**: CDN distribution, multiple edge locations
- **Backend**: Load balancer + multiple instances
- **Database**: MongoDB sharding, read replicas

### Vertical Scaling
- **Frontend**: Optimized bundle size, lazy loading
- **Backend**: Async operations, connection pooling
- **Database**: Indexed queries, aggregation pipelines

### Caching Strategy
```
┌─────────────┐
│   Browser   │ ← LocalStorage (JWT token)
└─────────────┘
       │
┌──────▼──────┐
│     CDN     │ ← Static assets (JS, CSS, images)
└─────────────┘
       │
┌──────▼──────┐
│   Backend   │ ← In-memory cache (future)
└─────────────┘
       │
┌──────▼──────┐
│  Database   │ ← Indexed queries
└─────────────┘
```

---

## Performance Metrics

### Target Metrics
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (p95)
- **Uptime**: 99.9%

### Optimization Techniques
1. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Bundle size reduction

2. **Backend**
   - Async operations
   - Connection pooling
   - Query optimization
   - Caching

3. **Database**
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Sharding (if needed)

---

**Architecture designed for enterprise-scale operations! 🚀**
