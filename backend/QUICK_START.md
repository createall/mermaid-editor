# Quick Start Guide

Get the Mermaid Editor backend running in 5 minutes!

## Prerequisites Check

```bash
# Check Python version (need 3.8+)
python3 --version

# Check PostgreSQL (need 12+)
psql --version

# If not installed, see SETUP_GUIDE.md for installation instructions
```

## 1. Install & Configure (2 minutes)

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Generate secret keys and update .env
python3 << EOF
import secrets
print("SECRET_KEY=" + secrets.token_urlsafe(32))
print("JWT_SECRET_KEY=" + secrets.token_urlsafe(32))
EOF

# Edit .env and update:
# - Database credentials (DB_PASSWORD, etc.)
# - Google OAuth credentials (after step 3)
nano .env
```

## 2. Setup Database (1 minute)

```bash
# Create PostgreSQL user and database
sudo -u postgres psql << EOF
CREATE USER mermaid_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE mermaid_editor OWNER mermaid_user;
GRANT ALL PRIVILEGES ON DATABASE mermaid_editor TO mermaid_user;
EOF

# Initialize database schema
python init_db.py
```

Expected output:
```
✅ Database initialization completed!
Database: mermaid_editor
Host: localhost
Port: 5432
```

## 3. Setup Google OAuth (2 minutes)

1. **Create Google Project**
   - Go to: https://console.cloud.google.com/
   - Click "New Project" → Name it → Create

2. **Enable API**
   - APIs & Services → Library → Search "Google+ API" → Enable

3. **Create OAuth Credentials**
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: "Mermaid Editor"
   - Authorized JavaScript origins:
     ```
     http://localhost:8000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:5000/api/auth/google/callback
     ```
   - Click Create

4. **Update .env**
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
   ```

## 4. Start Backend

```bash
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
```

## 5. Test API

```bash
# In a new terminal
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Mermaid Editor API is running"
}
```

## ✅ Success!

Your backend is now running. Next steps:

1. **Update Frontend** - Edit `frontend/api-manager.js` with your Google Client ID
2. **Test Login** - Start frontend: `cd frontend && python3 -m http.server 8000`
3. **Visit** - http://localhost:8000 and test Google login

## 🐳 Quick Start with Docker (Alternative)

If you prefer Docker:

```bash
cd backend

# Configure .env first
cp .env.example .env
nano .env  # Add your credentials

# Start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

## 🆘 Troubleshooting

**Database connection failed?**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
sudo systemctl start postgresql
```

**Port 5000 already in use?**
```bash
# Kill process on port 5000
kill -9 $(lsof -ti:5000)
```

**Module not found errors?**
```bash
# Make sure you're in backend directory
cd backend
# Reinstall dependencies
pip install -r requirements.txt
```

**Google OAuth not working?**
- Check Client ID/Secret in `.env`
- Verify redirect URIs match exactly (no trailing slash)
- Make sure Google+ API is enabled

## 📚 Full Documentation

- **Complete Setup:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **API Reference:** [README.md](README.md)
- **Implementation Overview:** [../AUTHENTICATION_IMPLEMENTATION.md](../AUTHENTICATION_IMPLEMENTATION.md)

## 🎯 Production Deployment

For production deployment, see [SETUP_GUIDE.md](SETUP_GUIDE.md) section "Production Checklist"

Key changes needed:
- Set `FLASK_ENV=production`
- Use strong secret keys
- Configure HTTPS
- Set up reverse proxy (nginx)
- Update Google OAuth redirect URIs

---

**Need Help?** Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting.
