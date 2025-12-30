/**
 * API Manager for Flask Backend
 * Replaces Firebase authentication and Firestore operations
 */
import { ENV } from './env.js';

const API_BASE_URL = ENV.API_BASE_URL;

export class ApiManager {
    constructor(onAuthChange) {
        this.user = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.onAuthChange = onAuthChange;

        // Load tokens from localStorage
        this.loadTokens();

        // Check authentication on init
        this.checkAuth();
    }

    loadTokens() {
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
    }

    saveTokens(accessToken, refreshToken) {
        this.accessToken = accessToken;
        if (refreshToken) {
            this.refreshToken = refreshToken;
        }
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    async checkAuth() {
        if (!this.accessToken) {
            this.user = null;
            if (this.onAuthChange) {
                this.onAuthChange(null);
            }
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = {
                    uid: data.user.id,
                    email: data.user.email,
                    displayName: data.user.display_name,
                    photoURL: data.user.photo_url
                };
                if (this.onAuthChange) {
                    this.onAuthChange(this.user);
                }
            } else if (response.status === 401) {
                // Token expired, try to refresh
                await this.refreshAccessToken();
            } else {
                this.clearTokens();
                this.user = null;
                if (this.onAuthChange) {
                    this.onAuthChange(null);
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.clearTokens();
            this.user = null;
            if (this.onAuthChange) {
                this.onAuthChange(null);
            }
        }
    }

    async refreshAccessToken() {
        if (!this.refreshToken) {
            this.clearTokens();
            this.user = null;
            if (this.onAuthChange) {
                this.onAuthChange(null);
            }
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: this.refreshToken
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.saveTokens(data.access_token);
                await this.checkAuth();
            } else {
                this.clearTokens();
                this.user = null;
                if (this.onAuthChange) {
                    this.onAuthChange(null);
                }
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.clearTokens();
            this.user = null;
            if (this.onAuthChange) {
                this.onAuthChange(null);
            }
        }
    }

    async loginWithGoogle() {
        return new Promise((resolve, reject) => {
            // Load Google Sign-In library
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);

            script.onload = () => {
                // Initialize Google Sign-In
                window.google.accounts.id.initialize({
                    client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',  // Replace with your client ID
                    callback: async (response) => {
                        try {
                            // Send ID token to backend
                            const result = await fetch(`${API_BASE_URL}/auth/google/verify`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    id_token: response.credential
                                })
                            });

                            if (result.ok) {
                                const data = await result.json();
                                this.saveTokens(data.access_token, data.refresh_token);
                                this.user = {
                                    uid: data.user.id,
                                    email: data.user.email,
                                    displayName: data.user.display_name,
                                    photoURL: data.user.photo_url
                                };
                                if (this.onAuthChange) {
                                    this.onAuthChange(this.user);
                                }
                                resolve(this.user);
                            } else {
                                const error = await result.json();
                                reject(new Error(error.error || 'Login failed'));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }
                });

                // Prompt the one-tap UI
                window.google.accounts.id.prompt();

                // Also render a button (fallback)
                const buttonDiv = document.createElement('div');
                buttonDiv.style.display = 'none';
                document.body.appendChild(buttonDiv);
                window.google.accounts.id.renderButton(buttonDiv, {
                    theme: 'outline',
                    size: 'large'
                });
                // Trigger click programmatically
                setTimeout(() => {
                    const btn = buttonDiv.querySelector('[role="button"]');
                    if (btn) btn.click();
                }, 100);
            };

            script.onerror = () => {
                reject(new Error('Failed to load Google Sign-In'));
            };
        });
    }

    async logout() {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: this.refreshToken
                })
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearTokens();
            this.user = null;
            if (this.onAuthChange) {
                this.onAuthChange(null);
            }
        }
    }

    async saveDiagram(title, code, thumbnail = null) {
        if (!this.user) throw new Error("User not authenticated");

        try {
            const response = await fetch(`${API_BASE_URL}/diagrams`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    code,
                    thumbnail
                })
            });

            if (response.status === 401) {
                await this.refreshAccessToken();
                return this.saveDiagram(title, code, thumbnail);
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save diagram');
            }

            const data = await response.json();
            return data.diagram.id;
        } catch (error) {
            console.error('Save diagram error:', error);
            throw error;
        }
    }

    async getUserDiagrams() {
        if (!this.user) return [];

        try {
            const response = await fetch(`${API_BASE_URL}/diagrams`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.status === 401) {
                await this.refreshAccessToken();
                return this.getUserDiagrams();
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch diagrams');
            }

            const data = await response.json();
            // Convert to Firebase-compatible format
            return data.diagrams.map(diagram => ({
                id: diagram.id,
                title: diagram.title,
                code: diagram.code,
                thumbnail: diagram.thumbnail,
                createdAt: { seconds: new Date(diagram.created_at).getTime() / 1000 },
                updatedAt: { seconds: new Date(diagram.updated_at).getTime() / 1000 }
            }));
        } catch (error) {
            console.error('Get diagrams error:', error);
            throw error;
        }
    }

    async deleteDiagram(diagramId) {
        if (!this.user) throw new Error("User not authenticated");

        try {
            const response = await fetch(`${API_BASE_URL}/diagrams/${diagramId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.status === 401) {
                await this.refreshAccessToken();
                return this.deleteDiagram(diagramId);
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete diagram');
            }

            return true;
        } catch (error) {
            console.error('Delete diagram error:', error);
            throw error;
        }
    }

    async updateDiagram(diagramId, code, thumbnail = null) {
        if (!this.user) throw new Error("User not authenticated");

        try {
            const body = { code };
            if (thumbnail) {
                body.thumbnail = thumbnail;
            }

            const response = await fetch(`${API_BASE_URL}/diagrams/${diagramId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.status === 401) {
                await this.refreshAccessToken();
                return this.updateDiagram(diagramId, code, thumbnail);
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update diagram');
            }

            const data = await response.json();
            return data.diagram.id;
        } catch (error) {
            console.error('Update diagram error:', error);
            throw error;
        }
    }
}
