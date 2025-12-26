-- Mermaid Editor Database Schema
-- PostgreSQL 12+

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS t_audit_logs CASCADE;
DROP TABLE IF EXISTS t_refresh_tokens CASCADE;
DROP TABLE IF EXISTS t_sessions CASCADE;
DROP TABLE IF EXISTS t_diagrams CASCADE;
DROP TABLE IF EXISTS t_users CASCADE;
-- Users table
CREATE TABLE t_users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_t_users_google_id ON t_users(google_id);
CREATE INDEX idx_t_users_email ON t_users(email);

-- Diagrams table
CREATE TABLE t_diagrams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    code TEXT NOT NULL,
    thumbnail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_t_diagrams_user_id ON t_diagrams(user_id);

-- Sessions table (for JWT token management and revocation)
CREATE TABLE t_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_users(id) ON DELETE CASCADE,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_t_sessions_user_id ON t_sessions(user_id);
CREATE INDEX idx_t_sessions_token_jti ON t_sessions(token_jti);
CREATE INDEX idx_t_sessions_expires_at ON t_sessions(expires_at);
CREATE INDEX idx_t_sessions_is_revoked ON t_sessions(is_revoked);

-- Refresh tokens table
CREATE TABLE t_refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_t_refresh_tokens_user_id ON t_refresh_tokens(user_id);
CREATE INDEX idx_t_refresh_tokens_token_hash ON t_refresh_tokens(token_hash);
CREATE INDEX idx_t_refresh_tokens_expires_at ON t_refresh_tokens(expires_at);
CREATE INDEX idx_t_refresh_tokens_is_revoked ON t_refresh_tokens(is_revoked);

-- Audit log for security tracking
CREATE TABLE t_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_t_audit_logs_user_id ON t_audit_logs(user_id);
CREATE INDEX idx_t_audit_logs_action ON t_audit_logs(action);
CREATE INDEX idx_t_audit_logs_resource ON t_audit_logs(resource_type, resource_id);
-- Function to clean up expired sessions and tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM t_sessions WHERE expires_at < CURRENT_TIMESTAMP AND is_revoked = FALSE;
    DELETE FROM t_refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP AND is_revoked = FALSE;
END;
$$ language 'plpgsql';
