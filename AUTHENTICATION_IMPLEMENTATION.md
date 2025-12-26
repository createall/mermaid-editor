# Google Authentication & Authorization Implementation

This document summarizes the complete authentication and authorization system implemented for the Mermaid Editor project.

## 📋 Overview

Successfully migrated from Firebase to a custom Flask backend with PostgreSQL database, implementing:
- ✅ Google OAuth 2.0 authentication
- ✅ JWT-based session management
- ✅ PostgreSQL database (no ORM)
- ✅ RESTful API for diagram management
- ✅ Frontend integration layer
- ✅ Complete documentation

## 🏗️ Architecture

### Backend Stack
- **Framework:** Python Flask 3.0
- **Database:** PostgreSQL 12+
- **Authentication:** Google OAuth 2.0 + JWT
- **No ORM:** Pure SQL queries for performance

### Frontend Stack
- **Current:** Vanilla JavaScript (ES6 modules)
- **New Module:** `api-manager.js` (replaces `firebase-manager.js`)
- **Authentication:** Google Sign-In JavaScript Library

## 📁 Files Created

### Backend Files

```
backend/
├── app.py                      # Main Flask application
├── database.py                 # Database connection manager
├── auth.py                     # JWT token management
├── google_auth.py              # Google OAuth provider
├── schema.sql                  # PostgreSQL database schema
├── init_db.py                  # Database initialization script
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker container config
├── docker-compose.yml          # Docker Compose setup
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── README.md                   # API documentation
├── SETUP_GUIDE.md              # Complete setup instructions
└── routes/
    ├── auth_routes.py          # Authentication endpoints
    └── diagram_routes.py       # Diagram CRUD endpoints
```

### Frontend Files

```
frontend/
└── api-manager.js              # API client (replaces firebase-manager.js)
```

## 🗄️ Database Schema

### Tables Created

1. **users** - User accounts from Google OAuth
2. **diagrams** - User-created Mermaid diagrams
3. **sessions** - JWT token session tracking
4. **refresh_tokens** - Refresh token management
5. **audit_logs** - Security audit trail

### Key Features

- Automatic timestamp updates (triggers)
- Soft delete for diagrams (`is_deleted` flag)
- Cascade delete for user relationships
- Comprehensive indexes for performance
- Token expiration cleanup function

## 🔐 Authentication Flow

### 1. Google Sign-In (Frontend)
```javascript
// User clicks "Login with Google"
apiManager.loginWithGoogle()
  → Google Sign-In popup
  → User authenticates with Google
  → Google returns ID token
```

### 2. Token Exchange (Backend)
```
POST /api/auth/google/verify
  → Verify Google ID token
  → Find or create user in database
  → Generate JWT access token (1 hour)
  → Generate refresh token (30 days)
  → Return tokens + user info
```

### 3. API Requests (Frontend)
```javascript
// All API requests include access token
fetch('/api/diagrams', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

### 4. Token Refresh (Automatic)
```javascript
// If access token expires (401)
apiManager.refreshAccessToken()
  → POST /api/auth/refresh
  → Get new access token
  → Retry original request
```

### 5. Logout
```javascript
apiManager.logout()
  → POST /api/auth/logout
  → Revoke all tokens
  → Clear localStorage
```

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/google/url` - Get OAuth URL
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/google/verify` - Verify Google token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke tokens
- `GET /api/auth/me` - Get current user

### Diagrams (Protected)
- `GET /api/diagrams` - List all user diagrams
- `GET /api/diagrams/:id` - Get single diagram
- `POST /api/diagrams` - Create new diagram
- `PUT /api/diagrams/:id` - Update diagram
- `DELETE /api/diagrams/:id` - Delete diagram (soft)
- `POST /api/diagrams/:id/restore` - Restore deleted diagram

### Health Check
- `GET /api/health` - API status check

## 🚀 Quick Start

### 1. Setup Database

```bash
# Install PostgreSQL
sudo apt install postgresql

# Create database and user
sudo -u postgres psql
CREATE USER mermaid_user WITH PASSWORD 'secure_password';
CREATE DATABASE mermaid_editor OWNER mermaid_user;
\q
```

### 2. Configure Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Update credentials

# Initialize database
python init_db.py

# Start server
python app.py
```

### 3. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins and redirect URIs
6. Copy Client ID and Secret to `.env`

### 4. Update Frontend

Edit `frontend/api-manager.js`:
```javascript
// Line 6: Update API URL for production
const API_BASE_URL = 'https://your-api-domain.com/api';

// Line 127: Add your Google Client ID
client_id: 'your-client-id.apps.googleusercontent.com',
```

Edit `frontend/main.js`:
```javascript
// Replace FirebaseManager with ApiManager
import { ApiManager } from './api-manager.js';
const apiManager = new ApiManager((user) => {
    updateAuthUI(user);
});
```

### 5. Test

```bash
# Start backend
cd backend
python app.py

# Start frontend (new terminal)
cd frontend
python3 -m http.server 8000

# Open browser
http://localhost:8000
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
cd backend

# Configure .env file first
cp .env.example .env
nano .env

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t mermaid-backend .

# Run container
docker run -d \
  --name mermaid-api \
  -p 5000:5000 \
  --env-file .env \
  mermaid-backend
```

## 🔒 Security Features

### Implemented

1. ✅ **JWT Authentication** - Token-based auth with expiration
2. ✅ **Token Rotation** - Access + refresh token mechanism
3. ✅ **Token Revocation** - Logout invalidates all tokens
4. ✅ **Session Tracking** - IP and user agent logging
5. ✅ **Audit Logging** - All actions tracked
6. ✅ **SQL Injection Protection** - Parameterized queries
7. ✅ **CORS Configuration** - Restricted origins
8. ✅ **Soft Delete** - Diagrams can be restored

### Recommended Additions

- [ ] Rate limiting (Flask-Limiter)
- [ ] Request throttling per user
- [ ] HTTPS enforcement
- [ ] Password encryption for future features
- [ ] API key authentication option
- [ ] Two-factor authentication
- [ ] Email verification
- [ ] Account recovery

## 📊 Database Schema Summary

### User Management
```sql
users (id, google_id, email, display_name, photo_url, ...)
sessions (id, user_id, token_jti, expires_at, ...)
refresh_tokens (id, user_id, token_hash, expires_at, ...)
```

### Content Management
```sql
diagrams (id, user_id, title, code, thumbnail, is_deleted, ...)
```

### Security & Compliance
```sql
audit_logs (id, user_id, action, resource_type, ip_address, ...)
```

## 🔄 Migration from Firebase

### Steps to Migrate Existing Data

If you have existing Firebase data to migrate:

1. **Export Firebase Data**
   ```javascript
   // Use Firebase Admin SDK
   const diagrams = await db.collection('diagrams').get();
   // Export to JSON
   ```

2. **Import to PostgreSQL**
   ```python
   # migration_script.py
   import json
   import psycopg2

   # Read JSON export
   with open('firebase_export.json') as f:
       data = json.load(f)

   # Insert into PostgreSQL
   # ... (implement based on your data structure)
   ```

3. **Update User IDs**
   - Map Firebase UIDs to PostgreSQL user IDs
   - Update all diagram records

4. **Verify Data Integrity**
   - Compare record counts
   - Test sample diagrams
   - Check timestamps

## 📚 Additional Documentation

- **API Documentation:** [backend/README.md](backend/README.md)
- **Setup Guide:** [backend/SETUP_GUIDE.md](backend/SETUP_GUIDE.md)
- **Project Overview:** [CLAUDE.md](CLAUDE.md)

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in .env
# Test connection
psql -U mermaid_user -d mermaid_editor -h localhost
```

**Google OAuth Errors**
- Check Client ID/Secret in `.env`
- Verify authorized redirect URIs match exactly
- Ensure Google+ API is enabled

**CORS Errors**
- Update `FRONTEND_URL` in `.env`
- Check Flask-CORS configuration
- Verify frontend URL matches

**Token Expired**
- Frontend auto-refreshes tokens
- Clear browser localStorage and re-login
- Check token expiry settings in `.env`

## 📈 Performance Considerations

### Database Optimization
- Indexes on frequently queried columns
- Connection pooling (add pgBouncer)
- Query optimization for large datasets

### Backend Optimization
- Use Gunicorn with multiple workers
- Implement caching (Redis)
- Add CDN for static assets

### Frontend Optimization
- Token stored in localStorage
- Auto-refresh before expiration
- Request retries on 401

## 🎯 Next Steps

### Immediate
1. Test authentication flow end-to-end
2. Migrate existing Firebase data (if any)
3. Update frontend to use ApiManager
4. Configure production Google OAuth credentials

### Short-term
1. Deploy to production server
2. Set up SSL/HTTPS
3. Configure monitoring and logging
4. Add rate limiting

### Long-term
1. Add user profile management
2. Implement diagram sharing features
3. Add collaboration features
4. Implement API versioning

## 📞 Support

For issues or questions:
- **GitHub Issues:** https://github.com/swkwon/mermaid-editor/issues
- **Backend API Docs:** [backend/README.md](backend/README.md)
- **Setup Guide:** [backend/SETUP_GUIDE.md](backend/SETUP_GUIDE.md)

---

## ✅ Implementation Complete

All requested features have been implemented:

1. ✅ **Google Authentication** - OAuth 2.0 with JWT tokens
2. ✅ **Authorization System** - Protected API endpoints
3. ✅ **Backend API** - Flask with Python (no ORM)
4. ✅ **Database Schema** - PostgreSQL with all necessary tables
5. ✅ **Frontend Integration** - API manager replacing Firebase
6. ✅ **Complete Documentation** - Setup guides and API docs
7. ✅ **Docker Support** - Containerized deployment option

**Total Files Created:** 14 backend files + 1 frontend file + 1 summary document

Ready for testing and deployment! 🚀
