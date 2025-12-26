"""Authentication and authorization utilities."""
import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import os
from database import db


class AuthManager:
    """Handles JWT token generation, validation, and user authentication."""

    def __init__(self):
        self.jwt_secret = os.getenv('JWT_SECRET_KEY')
        self.access_token_expires = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
        self.refresh_token_expires = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 2592000))

    def generate_access_token(self, user_id, email):
        """Generate JWT access token."""
        jti = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(seconds=self.access_token_expires)

        payload = {
            'user_id': user_id,
            'email': email,
            'jti': jti,
            'exp': expires_at,
            'iat': datetime.utcnow(),
            'type': 'access'
        }

        token = jwt.encode(payload, self.jwt_secret, algorithm='HS256')

        # Store session in database
        ip_address = request.remote_addr if request else None
        user_agent = request.headers.get('User-Agent') if request else None

        query = """
            INSERT INTO t_sessions (user_id, token_jti, expires_at, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s)
        """
        db.execute_query(query, (user_id, jti, expires_at, ip_address, user_agent))

        return token

    def generate_refresh_token(self, user_id):
        """Generate refresh token."""
        token = secrets.token_urlsafe(64)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(seconds=self.refresh_token_expires)

        query = """
            INSERT INTO t_refresh_tokens (user_id, token_hash, expires_at)
            VALUES (%s, %s, %s)
        """
        db.execute_query(query, (user_id, token_hash, expires_at))

        return token

    def verify_access_token(self, token):
        """Verify and decode JWT access token."""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])

            if payload.get('type') != 'access':
                return None

            # Check if session is revoked
            query = """
                SELECT is_revoked FROM t_sessions
                WHERE token_jti = %s AND expires_at > CURRENT_TIMESTAMP
            """
            result = db.execute_query(query, (payload['jti'],), fetch_one=True)

            if not result or result['is_revoked']:
                return None

            return payload

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def verify_refresh_token(self, token):
        """Verify refresh token."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        query = """
            SELECT user_id FROM t_refresh_tokens
            WHERE token_hash = %s
            AND expires_at > CURRENT_TIMESTAMP
            AND is_revoked = FALSE
        """
        result = db.execute_query(query, (token_hash,), fetch_one=True)

        return result['user_id'] if result else None

    def revoke_token(self, jti):
        """Revoke an access token."""
        query = "UPDATE t_sessions SET is_revoked = TRUE WHERE token_jti = %s"
        db.execute_query(query, (jti,))

    def revoke_refresh_token(self, token):
        """Revoke a refresh token."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        query = "UPDATE t_refresh_tokens SET is_revoked = TRUE WHERE token_hash = %s"
        db.execute_query(query, (token_hash,))

    def revoke_all_user_tokens(self, user_id):
        """Revoke all tokens for a user."""
        queries = [
            "UPDATE t_sessions SET is_revoked = TRUE WHERE user_id = %s",
            "UPDATE t_refresh_tokens SET is_revoked = TRUE WHERE user_id = %s"
        ]
        for query in queries:
            db.execute_query(query, (user_id,))

    def cleanup_expired_tokens(self):
        """Clean up expired tokens."""
        query = "SELECT cleanup_expired_tokens()"
        db.execute_query(query)


# Decorator for protected routes
def require_auth(f):
    """Decorator to require authentication for routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401

        token = auth_header.split(' ')[1]
        auth_manager = AuthManager()
        payload = auth_manager.verify_access_token(token)

        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Add user info to request context
        request.user_id = payload['user_id']
        request.user_email = payload['email']

        return f(*args, **kwargs)

    return decorated_function


def log_audit(action, resource_type=None, resource_id=None, metadata=None):
    """Log an audit event."""
    import json
    import logging
    import traceback

    logger = logging.getLogger(__name__)

    try:
        user_id = getattr(request, 'user_id', None)
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent')

        # Convert metadata to JSON string for JSONB column
        metadata_json = json.dumps(metadata) if metadata else None

        logger.debug(f"Audit log: action={action}, user_id={user_id}, metadata={metadata_json}")

        query = """
            INSERT INTO t_audit_logs
            (user_id, action, resource_type, resource_id, ip_address, user_agent, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        db.execute_query(
            query,
            (user_id, action, resource_type, resource_id, ip_address, user_agent, metadata_json)
        )
        logger.debug("Audit log inserted successfully")
    except Exception as e:
        logger.error(f"Failed to log audit event: {e}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        # Don't raise - audit logging failure shouldn't break the main flow
