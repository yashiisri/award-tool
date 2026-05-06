# 🚀 Deployment Guide - KPMG Award Management Tool

## Production Deployment Checklist

### Pre-Deployment
- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL certificates ready
- [ ] Domain name configured
- [ ] Monitoring tools setup

---

## 🗄️ Database Deployment (MongoDB Atlas)

### 1. Production Cluster Setup

1. **Upgrade to Production Tier**
   - Go to MongoDB Atlas dashboard
   - Upgrade from M0 (free) to M10+ for production
   - Enable automated backups
   - Configure point-in-time recovery

2. **Security Configuration**
   ```
   - Enable IP Whitelist (add production server IPs)
   - Create dedicated database user for production
   - Use strong password (32+ characters)
   - Enable audit logs
   ```

3. **Performance Optimization**
   ```javascript
   // Create indexes for better performance
   db.users.createIndex({ username: 1 }, { unique: true })
   db.users.createIndex({ email: 1 }, { unique: true })
   db.nominees.createIndex({ category_id: 1 })
   db.votes.createIndex({ nominee_id: 1, jury_id: 1 })
   db.audit_logs.createIndex({ timestamp: -1 })
   ```

4. **Connection String**
   ```
   mongodb+srv://prod_user:STRONG_PASSWORD@cluster.mongodb.net/kpmg_awards_prod?retryWrites=true&w=majority
   ```

---

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repository

2. **Deploy Backend**
   ```bash
   # Railway will auto-detect Python
   # Add environment variables in Railway dashboard:
   
   MONGODB_URL=mongodb+srv://...
   DATABASE_NAME=kpmg_awards_prod
   SECRET_KEY=generate-a-super-secure-random-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

3. **Configure Build**
   ```toml
   # railway.toml
   [build]
   builder = "NIXPACKS"
   buildCommand = "pip install -r requirements.txt"
   
   [deploy]
   startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
   ```

4. **Get Backend URL**
   - Railway provides: `https://your-app.railway.app`

### Option 2: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Create new Web Service

2. **Configure Service**
   ```yaml
   # Build Command
   pip install -r requirements.txt
   
   # Start Command
   uvicorn main:app --host 0.0.0.0 --port $PORT
   
   # Environment Variables (add in Render dashboard)
   MONGODB_URL=...
   DATABASE_NAME=kpmg_awards_prod
   SECRET_KEY=...
   ```

### Option 3: AWS EC2

1. **Launch EC2 Instance**
   ```bash
   # Ubuntu 22.04 LTS
   # t3.small or larger
   ```

2. **Setup Server**
   ```bash
   # SSH into server
   ssh -i key.pem ubuntu@your-ip
   
   # Install dependencies
   sudo apt update
   sudo apt install python3-pip python3-venv nginx
   
   # Clone repository
   git clone <your-repo>
   cd backend
   
   # Setup virtual environment
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Create .env file
   nano .env
   # Add production environment variables
   ```

3. **Setup Systemd Service**
   ```bash
   sudo nano /etc/systemd/system/kpmg-awards.service
   ```
   
   ```ini
   [Unit]
   Description=KPMG Awards API
   After=network.target
   
   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/backend
   Environment="PATH=/home/ubuntu/backend/venv/bin"
   ExecStart=/home/ubuntu/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   ```bash
   sudo systemctl enable kpmg-awards
   sudo systemctl start kpmg-awards
   ```

4. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/kpmg-awards
   ```
   
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/kpmg-awards /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository

2. **Configure Project**
   ```bash
   # Root Directory: frontend
   # Framework Preset: Vite
   # Build Command: npm run build
   # Output Directory: dist
   ```

3. **Update API URL**
   ```javascript
   // frontend/src/api/axios.js
   const api = axios.create({
     baseURL: 'https://your-backend.railway.app/api'
   })
   ```

4. **Deploy**
   - Vercel auto-deploys on git push
   - Get URL: `https://your-app.vercel.app`

### Option 2: Netlify

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Import repository

2. **Configure Build**
   ```toml
   # netlify.toml
   [build]
     base = "frontend"
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Update API URL**
   ```javascript
   // frontend/src/api/axios.js
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'https://your-backend.railway.app/api'
   })
   ```

4. **Environment Variables**
   ```bash
   # Add in Netlify dashboard
   VITE_API_URL=https://your-backend.railway.app/api
   ```

### Option 3: AWS S3 + CloudFront

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://kpmg-awards-frontend
   aws s3 sync dist/ s3://kpmg-awards-frontend
   ```

3. **Configure S3 for Static Hosting**
   - Enable static website hosting
   - Set index.html as index document

4. **Setup CloudFront**
   - Create CloudFront distribution
   - Point to S3 bucket
   - Configure SSL certificate
   - Set custom domain

---

## 🔐 Security Hardening

### Backend Security

1. **Update CORS Settings**
   ```python
   # backend/main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-frontend-domain.com"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Generate Strong SECRET_KEY**
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   # Use this as SECRET_KEY in production
   ```

3. **Enable HTTPS Only**
   ```python
   # Force HTTPS in production
   from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
   app.add_middleware(HTTPSRedirectMiddleware)
   ```

### Database Security

1. **Restrict IP Access**
   - Only allow production server IPs
   - Remove 0.0.0.0/0 (allow all)

2. **Enable Encryption**
   - Enable encryption at rest
   - Use TLS/SSL for connections

3. **Regular Backups**
   - Enable automated daily backups
   - Test restore procedures

---

## 📊 Monitoring & Logging

### Application Monitoring

1. **Sentry (Error Tracking)**
   ```bash
   pip install sentry-sdk[fastapi]
   ```
   
   ```python
   # backend/main.py
   import sentry_sdk
   
   sentry_sdk.init(
       dsn="your-sentry-dsn",
       traces_sample_rate=1.0,
   )
   ```

2. **LogRocket (Frontend)**
   ```bash
   npm install logrocket
   ```
   
   ```javascript
   // frontend/src/main.jsx
   import LogRocket from 'logrocket';
   LogRocket.init('your-app-id');
   ```

### Database Monitoring

1. **MongoDB Atlas Monitoring**
   - Enable performance advisor
   - Set up alerts for:
     - High CPU usage
     - Low disk space
     - Connection spikes

2. **Custom Metrics**
   ```python
   # Track API response times
   # Track user activity
   # Track error rates
   ```

---

## 🧪 Testing in Production

### Smoke Tests

```bash
# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Test health endpoint
curl https://api.yourdomain.com/

# Test CORS
curl -H "Origin: https://yourdomain.com" \
  --head https://api.yourdomain.com/api/admin/categories
```

### Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 https://api.yourdomain.com/
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          # Railway auto-deploys on push
          
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          # Vercel auto-deploys on push
```

---

## 📋 Post-Deployment Checklist

- [ ] Backend API accessible via HTTPS
- [ ] Frontend accessible via HTTPS
- [ ] Database connections working
- [ ] Authentication working
- [ ] All API endpoints responding
- [ ] CORS configured correctly
- [ ] SSL certificates valid
- [ ] Monitoring tools active
- [ ] Backup system verified
- [ ] Error tracking working
- [ ] Performance acceptable
- [ ] Security scan passed

---

## 🆘 Rollback Procedure

### Quick Rollback

1. **Vercel/Netlify**
   - Go to deployments
   - Click "Rollback" on previous version

2. **Railway/Render**
   - Redeploy previous commit
   - Or use platform rollback feature

3. **Database**
   - Restore from backup if needed
   - MongoDB Atlas: Restore from snapshot

---

## 📞 Support Contacts

- **MongoDB Atlas**: support@mongodb.com
- **Vercel**: support@vercel.com
- **Railway**: help@railway.app
- **Render**: support@render.com

---

**Production Deployment Complete! 🎉**
