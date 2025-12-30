/**
 * Backend API client for authentication and diagram management
 */

// Auto-detect API URL based on environment
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'https://working-mermaid-editor.createall.me/api'
    : 'https://working-mermaid-editor.createall.me/api';  // TODO: Update with your production backend URL

export class BackendAPI {
    constructor() {
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        this.user = null;
    }

    /**
     * Get authorization headers with JWT token
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        return headers;
    }

    /**
     * Make authenticated API request with automatic token refresh
     */
    async fetchWithAuth(url, options = {}) {
        options.headers = { ...this.getAuthHeaders(), ...options.headers };

        let response = await fetch(url, options);

        // If token expired, try to refresh
        if (response.status === 401 && this.refreshToken) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                // Retry the original request with new token
                options.headers['Authorization'] = `Bearer ${this.accessToken}`;
                response = await fetch(url, options);
            }
        }

        return response;
    }

    /**
     * Initiate Google OAuth login
     */
    async loginWithGoogle() {
        try {
            // Redirect to backend OAuth endpoint with cache buster
            const timestamp = new Date().getTime();
            window.location.href = `${API_BASE_URL}/auth/google/url?_=${timestamp}`;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Handle OAuth callback and store tokens
     */
    handleOAuthCallback() {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const error = params.get('error');

        if (error) {
            console.error('OAuth error:', error);
            return false;
        }

        if (accessToken && refreshToken) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
        }

        return false;
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.access_token;
                localStorage.setItem('access_token', data.access_token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
        }

        // Refresh failed, clear tokens
        this.logout();
        return false;
    }

    /**
     * Get current user info
     */
    async getCurrentUser() {
        if (!this.accessToken) return null;

        try {
            const response = await this.fetchWithAuth(`${API_BASE_URL}/auth/me`);
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                return this.user;
            }
        } catch (error) {
            console.error('Get user error:', error);
        }

        return null;
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            if (this.accessToken) {
                await this.fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    body: JSON.stringify({ refresh_token: this.refreshToken })
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.accessToken = null;
            this.refreshToken = null;
            this.user = null;
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.accessToken;
    }

    // ==================== Diagram API Methods ====================

    /**
     * Get all user diagrams
     */
    async getDiagrams() {
        const response = await this.fetchWithAuth(`${API_BASE_URL}/diagrams`);
        if (response.ok) {
            const data = await response.json();
            return data.diagrams;
        }
        throw new Error('Failed to fetch diagrams');
    }

    /**
     * Get a specific diagram
     */
    async getDiagram(diagramId) {
        const response = await this.fetchWithAuth(`${API_BASE_URL}/diagrams/${diagramId}`);
        if (response.ok) {
            const data = await response.json();
            return data.diagram;
        }
        throw new Error('Failed to fetch diagram');
    }

    /**
     * Create a new diagram
     */
    async createDiagram(title, code, thumbnail = null) {
        const response = await this.fetchWithAuth(`${API_BASE_URL}/diagrams`, {
            method: 'POST',
            body: JSON.stringify({ title, code, thumbnail })
        });

        if (response.ok) {
            const data = await response.json();
            return data.diagram;
        }
        throw new Error('Failed to create diagram');
    }

    /**
     * Update an existing diagram
     */
    async updateDiagram(diagramId, updates) {
        const response = await this.fetchWithAuth(`${API_BASE_URL}/diagrams/${diagramId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            const data = await response.json();
            return data.diagram;
        }
        throw new Error('Failed to update diagram');
    }

    /**
     * Delete a diagram (soft delete)
     */
    async deleteDiagram(diagramId) {
        const response = await this.fetchWithAuth(`${API_BASE_URL}/diagrams/${diagramId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            return true;
        }
        throw new Error('Failed to delete diagram');
    }
}
