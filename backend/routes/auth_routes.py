"""Authentication routes."""
from flask import Blueprint, request, jsonify, redirect
from google_auth import GoogleAuthProvider
from auth import AuthManager, log_audit
import secrets
import os

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
google_auth = GoogleAuthProvider()
auth_manager = AuthManager()


@auth_bp.route('/google/url', methods=['GET'])
def get_google_auth_url():
    """Redirect to Google OAuth authorization URL."""
    try:
        state = secrets.token_urlsafe(32)
        # In production, store state in session or cache to verify later
        url = google_auth.get_authorization_url(state)
        return redirect(url)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback."""
    import logging
    import traceback
    logger = logging.getLogger(__name__)

    try:
        logger.info("=== Google OAuth Callback Started ===")
        code = request.args.get('code')
        error = request.args.get('error')

        logger.info(f"Received code: {code[:20]}..." if code else "No code received")

        if error:
            logger.error(f"OAuth error from Google: {error}")
            return jsonify({'error': error}), 400

        if not code:
            logger.error("No authorization code provided")
            return jsonify({'error': 'No authorization code provided'}), 400

        # Exchange code for tokens
        logger.info("Step 1: Exchanging code for tokens...")
        token_data = google_auth.exchange_code_for_token(code)
        logger.info("Token exchange successful")

        id_token = token_data.get('id_token')
        access_token = token_data.get('access_token')

        # Verify ID token
        logger.info("Step 2: Verifying ID token...")
        id_info = google_auth.verify_id_token(id_token)
        if not id_info:
            logger.error("ID token verification failed")
            return jsonify({'error': 'Invalid ID token'}), 401
        logger.info(f"ID token verified for user: {id_info.get('email')}")

        # Get user info
        logger.info("Step 3: Getting user info from Google...")
        user_info = google_auth.get_user_info(access_token)
        logger.info(f"User info retrieved: {user_info.get('email')}")

        # Find or create user
        logger.info("Step 4: Finding or creating user in database...")
        user = google_auth.find_or_create_user(user_info)
        logger.info(f"User found/created with ID: {user['id']}")

        # Generate JWT tokens
        logger.info("Step 5: Generating JWT tokens...")
        jwt_access_token = auth_manager.generate_access_token(user['id'], user['email'])
        jwt_refresh_token = auth_manager.generate_refresh_token(user['id'])
        logger.info("JWT tokens generated successfully")

        # Log audit event
        logger.info("Step 6: Logging audit event...")
        log_audit('login', metadata={'method': 'google_oauth'})
        logger.info("Audit log created")

        # Redirect to frontend with tokens in URL
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8000')
        redirect_url = f"{frontend_url}/?access_token={jwt_access_token}&refresh_token={jwt_refresh_token}"
        logger.info(f"Step 7: Redirecting to frontend: {frontend_url}")
        logger.info("=== Google OAuth Callback Completed Successfully ===")
        return redirect(redirect_url)

    except Exception as e:
        logger.error("=== Google OAuth Callback Failed ===")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/google/verify', methods=['POST'])
def verify_google_token():
    """Verify Google ID token (for popup/redirect flow)."""
    try:
        data = request.get_json()
        id_token = data.get('id_token')

        if not id_token:
            return jsonify({'error': 'No ID token provided'}), 400

        # Verify ID token
        id_info = google_auth.verify_id_token(id_token)
        if not id_info:
            return jsonify({'error': 'Invalid ID token'}), 401

        # Find or create user
        user = google_auth.find_or_create_user(id_info)

        # Generate JWT tokens
        jwt_access_token = auth_manager.generate_access_token(user['id'], user['email'])
        jwt_refresh_token = auth_manager.generate_refresh_token(user['id'])

        # Log audit event
        log_audit('login', metadata={'method': 'google_oauth'})

        return jsonify({
            'access_token': jwt_access_token,
            'refresh_token': jwt_refresh_token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'display_name': user['display_name'],
                'photo_url': user['photo_url']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token."""
    try:
        data = request.get_json()
        refresh_token = data.get('refresh_token')

        if not refresh_token:
            return jsonify({'error': 'No refresh token provided'}), 400

        # Verify refresh token
        user_id = auth_manager.verify_refresh_token(refresh_token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired refresh token'}), 401

        # Get user info
        from database import db
        query = "SELECT id, email FROM t_users WHERE id = %s"
        user = db.execute_query(query, (user_id,), fetch_one=True)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Generate new access token
        new_access_token = auth_manager.generate_access_token(user['id'], user['email'])

        return jsonify({'access_token': new_access_token}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user and revoke tokens."""
    try:
        auth_header = request.headers.get('Authorization')
        data = request.get_json() or {}
        refresh_token = data.get('refresh_token')

        # Revoke access token if provided
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = auth_manager.verify_access_token(token)
            if payload:
                auth_manager.revoke_token(payload['jti'])

        # Revoke refresh token if provided
        if refresh_token:
            auth_manager.revoke_refresh_token(refresh_token)

        # Log audit event
        log_audit('logout')

        return jsonify({'message': 'Logged out successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user info."""
    try:
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization header'}), 401

        token = auth_header.split(' ')[1]
        payload = auth_manager.verify_access_token(token)

        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Get user info
        from database import db
        query = "SELECT id, email, display_name, photo_url, created_at FROM t_users WHERE id = %s"
        user = db.execute_query(query, (payload['user_id'],), fetch_one=True)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'user': {
                'id': user['id'],
                'email': user['email'],
                'display_name': user['display_name'],
                'photo_url': user['photo_url'],
                'created_at': user['created_at'].isoformat() if user['created_at'] else None
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
