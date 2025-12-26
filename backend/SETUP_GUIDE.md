# Complete Setup Guide

This guide will walk you through setting up the Mermaid Editor backend from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Integration](#frontend-integration)
5. [Google OAuth Setup](#google-oauth-setup)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

### Install Python 3.8+

Check if Python is installed:
```bash
python3 --version
```

If not installed:
- **Ubuntu/Debian:** `sudo apt install python3 python3-pip`
- **macOS:** `brew install python3`
- **Windows:** Download from [python.org](https://www.python.org/downloads/)

---

## Database Setup

### 1. Create PostgreSQL User and Database

```bash
# Login as postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE USER mermaid_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE mermaid_editor OWNER mermaid_user;
GRANT ALL PRIVILEGES ON DATABASE mermaid_editor TO mermaid_user;
\q
```

### 2. Test Database Connection

```bash
psql -U mermaid_user -d mermaid_editor -h localhost
# Enter password when prompted
# If successful, you'll see: mermaid_editor=>
\q
```

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd /home/ssolee/workspace/mypjt/mermaid-editor/backend
```

### 2. Create Virtual Environment (Recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
cp .env.example .env
nano .env  # Or use your preferred editor
```

Update the following values in `.env`:

```env
# Generate secret keys (run in Python):
# import secrets; print(secrets.token_urlsafe(32))
SECRET_KEY=<generated-secret-key>
JWT_SECRET_KEY=<generated-jwt-secret-key>

# Database (use values from step 1)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mermaid_editor
DB_USER=mermaid_user
DB_PASSWORD=your_secure_password

# Google OAuth (will configure later)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:8000
```

### 5. Initialize Database

```bash
python init_db.py
```

Expected output:
```
Initializing database...
Creating database 'mermaid_editor'...
Database 'mermaid_editor' created successfully!
Executing schema.sql...
Database schema created successfully!

✅ Database initialization completed!
```

### 6. Start the Backend Server

```bash
python app.py
```

Expected output:
```
 * Serving Flask app 'app.py'
 * Running on http://0.0.0.0:5000
```

### 7. Test Health Check

Open browser or use curl:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Mermaid Editor API is running"
}
```

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Mermaid Editor"
4. Click "Create"

### 2. Enable Google+ API

1. In left sidebar, click "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (or "Internal" for G Suite)
3. Fill in required fields:
   - **App name:** Mermaid Editor
   - **User support email:** your-email@example.com
   - **Developer contact:** your-email@example.com
4. Click "Save and Continue"
5. Add scopes (click "Add or Remove Scopes"):
   - `openid`
   - `email`
   - `profile`
6. Click "Save and Continue"
7. Add test users (your email)
8. Click "Save and Continue"

### 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Name: "Mermaid Editor Web Client"
5. Add **Authorized JavaScript origins:**
   ```
   http://localhost:8000
   http://localhost:3000
   https://swkwon.github.io
   ```
6. Add **Authorized redirect URIs:**
   ```
   http://localhost:5000/api/auth/google/callback
   https://your-production-domain.com/api/auth/google/callback
   ```
7. Click "Create"
8. Copy **Client ID** and **Client Secret**

### 5. Update Backend .env

Update your `.env` file with the credentials:
```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

Restart the backend server:
```bash
# Press Ctrl+C to stop
python app.py
```

---

## Frontend Integration

### 1. Update API Manager

Edit [frontend/api-manager.js](frontend/api-manager.js:127):

Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID:

```javascript
client_id: '123456789-abcdefg.apps.googleusercontent.com',
```

### 2. Update API Base URL (for Production)

In [frontend/api-manager.js](frontend/api-manager.js:6):

```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';  // Production
// const API_BASE_URL = 'http://localhost:5000/api';  // Development
```

### 3. Replace Firebase with API Manager

In [frontend/main.js](frontend/main.js:4), replace:

```javascript
// OLD:
import { FirebaseManager } from './firebase-manager.js';

// NEW:
import { ApiManager } from './api-manager.js';
```

And replace:

```javascript
// OLD:
const firebaseManager = new FirebaseManager((user) => {
    updateAuthUI(user);
});

// NEW:
const apiManager = new ApiManager((user) => {
    updateAuthUI(user);
});
```

Replace all instances of `firebaseManager` with `apiManager` in the file.

### 4. Serve Frontend

```bash
cd ../frontend
python3 -m http.server 8000
```

Visit: http://localhost:8000

---

## Testing

### 1. Test Authentication Flow

1. Open http://localhost:8000
2. Click "Login" button
3. Google Sign-In popup should appear
4. Sign in with your Google account
5. After successful login, your avatar should appear

### 2. Test Diagram Operations

1. Create a diagram in the editor
2. Click "Cloud Save"
3. Enter a title and click "Save New"
4. Click "Cloud Load" to see your saved diagram
5. Try updating and deleting diagrams

### 3. Test API Endpoints (with curl)

**Login (get token):**
```bash
# You'll need to complete the OAuth flow in browser first
# Then use the access token for other requests
```

**Get diagrams:**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5000/api/diagrams
```

**Create diagram:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","code":"graph TD\nA-->B"}' \
  http://localhost:5000/api/diagrams
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `psycopg2.OperationalError: FATAL: password authentication failed`

**Solution:**
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify credentials in `.env` match database user
3. Check PostgreSQL authentication config:
   ```bash
   sudo nano /etc/postgresql/[version]/main/pg_hba.conf
   ```
   Ensure line exists:
   ```
   local   all   all   md5
   ```
4. Restart PostgreSQL: `sudo systemctl restart postgresql`

### Google OAuth Errors

**Error:** `redirect_uri_mismatch`

**Solution:**
1. Ensure redirect URI in Google Console matches exactly
2. Include protocol (http/https) and port
3. No trailing slashes

**Error:** `invalid_client`

**Solution:**
1. Verify Client ID and Secret in `.env`
2. Check for extra spaces or quotes
3. Regenerate credentials if needed

### CORS Errors

**Error:** `Access-Control-Allow-Origin`

**Solution:**
1. Check `FRONTEND_URL` in backend `.env`
2. Verify Flask-CORS configuration in [app.py](backend/app.py)
3. Ensure frontend is served from configured URL

### Token Expiration

**Error:** `Invalid or expired token`

**Solution:**
1. Frontend should auto-refresh using refresh token
2. Check token expiry times in `.env`:
   ```env
   JWT_ACCESS_TOKEN_EXPIRES=3600  # 1 hour
   JWT_REFRESH_TOKEN_EXPIRES=2592000  # 30 days
   ```
3. Clear browser localStorage and login again

### Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)

# Or use different port
python app.py --port 5001
```

---

## Production Checklist

Before deploying to production:

- [ ] Change `FLASK_ENV` to `production`
- [ ] Generate strong secrets for `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Use environment-specific database credentials
- [ ] Configure HTTPS for all URLs
- [ ] Update Google OAuth redirect URIs for production domain
- [ ] Set up reverse proxy (nginx) with SSL
- [ ] Use process manager (systemd, supervisor)
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Set up rate limiting
- [ ] Review CORS configuration

---

## Next Steps

1. **Deploy Backend:** Use Docker, AWS, or other cloud provider
2. **Set Up CI/CD:** Automate deployment with GitHub Actions
3. **Add Monitoring:** Use Sentry, Datadog, or similar
4. **Performance Tuning:** Add caching, optimize queries
5. **Security Audit:** Review all endpoints and permissions

## Support

For issues or questions:
- GitHub Issues: https://github.com/swkwon/mermaid-editor/issues
- Backend API Docs: [backend/README.md](backend/README.md)

---

**Happy Coding! 🚀**
