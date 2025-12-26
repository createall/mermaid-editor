"""Google OAuth 2.0 authentication."""
import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from database import db


class GoogleAuthProvider:
    """Handles Google OAuth 2.0 authentication."""

    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI')
        self.token_url = 'https://oauth2.googleapis.com/token'
        self.userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo'

    def get_authorization_url(self, state=None):
        """Generate Google OAuth authorization URL."""
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'scope': 'openid email profile',
            'access_type': 'offline',
            'prompt': 'consent'
        }

        if state:
            params['state'] = state

        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"

    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token."""
        data = {
            'code': code,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'redirect_uri': self.redirect_uri,
            'grant_type': 'authorization_code'
        }

        response = requests.post(self.token_url, data=data)
        response.raise_for_status()
        return response.json()

    def verify_id_token(self, token):
        """Verify Google ID token."""
        try:
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                self.client_id
            )
            return id_info
        except ValueError:
            return None

    def get_user_info(self, access_token):
        """Get user info from Google."""
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(self.userinfo_url, headers=headers)
        response.raise_for_status()
        return response.json()

    def find_or_create_user(self, google_user_info):
        """Find existing user or create new one."""
        google_id = google_user_info['id']
        email = google_user_info['email']
        display_name = google_user_info.get('name', '')
        photo_url = google_user_info.get('picture', '')

        # Try to find existing user
        query = "SELECT * FROM t_users WHERE google_id = %s"
        user = db.execute_query(query, (google_id,), fetch_one=True)

        if user:
            # Update last login and user info
            update_query = """
                UPDATE t_users
                SET last_login = CURRENT_TIMESTAMP,
                    display_name = %s,
                    photo_url = %s,
                    email = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """
            user = db.execute_query(
                update_query,
                (display_name, photo_url, email, user['id']),
                fetch_one=True
            )
        else:
            # Create new user
            insert_query = """
                INSERT INTO t_users (google_id, email, display_name, photo_url, last_login)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                RETURNING *
            """
            user = db.execute_query(
                insert_query,
                (google_id, email, display_name, photo_url),
                fetch_one=True
            )

        return user
