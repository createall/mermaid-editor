# Mermaid Editor Backend API

Flask-based REST API for the Mermaid Diagram Editor with Google OAuth 2.0 authentication and PostgreSQL database.

## 🚀 Features

- **Google OAuth 2.0 Authentication** - Secure login with Google accounts
- **JWT Token Management** - Access and refresh tokens with automatic expiration
- **PostgreSQL Database** - No ORM, pure SQL for performance and control
- **Diagram Management** - CRUD operations for Mermaid diagrams
- **Audit Logging** - Track all user actions for security
- **Session Management** - Token revocation and session tracking
- **CORS Support** - Configured for frontend integration

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Google Cloud Project with OAuth 2.0 credentials

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here-change-in-production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mermaid_editor
DB_USER=postgres
DB_PASSWORD=your-database-password

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8000

# JWT Configuration
JWT_ACCESS_TOKEN_EXPIRES=3600  # 1 hour
JWT_REFRESH_TOKEN_EXPIRES=2592000  # 30 days
```

### 3. Setup Google OAuth 2.0

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `https://yourdomain.com/api/auth/google/callback` (production)
7. Add authorized JavaScript origins:
   - `http://localhost:8000`
   - `https://yourdomain.com` (production)
8. Copy Client ID and Client Secret to `.env`

### 4. Initialize Database

```bash
python init_db.py
```

This will:
- Create the PostgreSQL database
- Run schema migrations
- Set up all tables and indexes

### 5. Run the Application

```bash
# Development
python app.py

# Production (use gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Endpoints

### 1. Get Google Auth URL

Get the Google OAuth authorization URL.

**Endpoint:** `GET /api/auth/google/url`

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-state-token"
}
```

---

### 2. Google OAuth Callback

Handle Google OAuth callback (redirect flow).

**Endpoint:** `GET /api/auth/google/callback?code=xxx`

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "random-refresh-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "display_name": "John Doe",
    "photo_url": "https://..."
  }
}
```

---

### 3. Verify Google Token

Verify Google ID token (popup/redirect flow).

**Endpoint:** `POST /api/auth/google/verify`

**Request Body:**
```json
{
  "id_token": "google-id-token"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "random-refresh-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "display_name": "John Doe",
    "photo_url": "https://..."
  }
}
```

---

### 4. Refresh Access Token

Get a new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "your-refresh-token"
}
```

**Response:**
```json
{
  "access_token": "new-access-token"
}
```

---

### 5. Logout

Revoke tokens and logout.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh_token": "your-refresh-token"
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### 6. Get Current User

Get current authenticated user info.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "display_name": "John Doe",
    "photo_url": "https://...",
    "created_at": "2025-01-15T10:30:00"
  }
}
```

---

## 📊 Diagram Endpoints

### 1. Get All Diagrams

Get all diagrams for authenticated user.

**Endpoint:** `GET /api/diagrams`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "diagrams": [
    {
      "id": 1,
      "title": "My Flowchart",
      "code": "graph TD\n  A-->B",
      "thumbnail": "data:image/svg+xml;base64,...",
      "created_at": "2025-01-15T10:30:00",
      "updated_at": "2025-01-15T11:00:00"
    }
  ]
}
```

---

### 2. Get Single Diagram

Get a specific diagram by ID.

**Endpoint:** `GET /api/diagrams/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "diagram": {
    "id": 1,
    "title": "My Flowchart",
    "code": "graph TD\n  A-->B",
    "thumbnail": "data:image/svg+xml;base64,...",
    "created_at": "2025-01-15T10:30:00",
    "updated_at": "2025-01-15T11:00:00"
  }
}
```

---

### 3. Create Diagram

Create a new diagram.

**Endpoint:** `POST /api/diagrams`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "My New Diagram",
  "code": "graph TD\n  A-->B",
  "thumbnail": "data:image/svg+xml;base64,..."
}
```

**Response:**
```json
{
  "diagram": {
    "id": 2,
    "title": "My New Diagram",
    "code": "graph TD\n  A-->B",
    "thumbnail": "data:image/svg+xml;base64,...",
    "created_at": "2025-01-15T12:00:00",
    "updated_at": "2025-01-15T12:00:00"
  }
}
```

---

### 4. Update Diagram

Update an existing diagram.

**Endpoint:** `PUT /api/diagrams/:id`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "code": "graph TD\n  A-->B-->C",
  "thumbnail": "data:image/svg+xml;base64,..."
}
```

**Response:**
```json
{
  "diagram": {
    "id": 1,
    "title": "Updated Title",
    "code": "graph TD\n  A-->B-->C",
    "thumbnail": "data:image/svg+xml;base64,...",
    "created_at": "2025-01-15T10:30:00",
    "updated_at": "2025-01-15T12:30:00"
  }
}
```

---

### 5. Delete Diagram

Soft delete a diagram.

**Endpoint:** `DELETE /api/diagrams/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Diagram deleted successfully"
}
```

---

### 6. Restore Diagram

Restore a soft-deleted diagram.

**Endpoint:** `POST /api/diagrams/:id/restore`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Diagram restored successfully"
}
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Diagrams Table
```sql
CREATE TABLE diagrams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    code TEXT NOT NULL,
    thumbnail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Security Features

1. **JWT-based Authentication** - Secure token-based auth
2. **Token Rotation** - Access and refresh token mechanism
3. **Token Revocation** - Logout revokes all tokens
4. **Session Tracking** - IP address and user agent logging
5. **Audit Logging** - All actions are logged
6. **SQL Injection Protection** - Parameterized queries
7. **CORS Configuration** - Restricted to frontend domain
8. **Password-less Auth** - Google OAuth only

## 📦 Project Structure

```
backend/
├── app.py                  # Main Flask application
├── database.py             # Database connection manager
├── auth.py                 # JWT authentication utilities
├── google_auth.py          # Google OAuth provider
├── schema.sql              # Database schema
├── init_db.py              # Database initialization script
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variables template
├── routes/
│   ├── auth_routes.py      # Authentication endpoints
│   └── diagram_routes.py   # Diagram management endpoints
└── README.md               # This file
```

## 🚢 Production Deployment

### Using Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Environment Variables for Production

- Change `FLASK_ENV` to `production`
- Use strong random values for `SECRET_KEY` and `JWT_SECRET_KEY`
- Configure production database credentials
- Update `FRONTEND_URL` to production domain
- Use HTTPS for all URLs

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-flask

# Run tests
pytest
```

## 📝 License

MIT License - See main project LICENSE file

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
