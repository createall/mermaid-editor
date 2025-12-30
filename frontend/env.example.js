/**
 * Environment configuration for frontend - EXAMPLE FILE
 *
 * Copy this file to env.js and update the values for your environment
 *
 * Usage:
 * 1. Development: Copy to env.js and set API_BASE_URL to localhost
 * 2. Production: Copy to env.js and set API_BASE_URL to production URL
 */

export const ENV = {
    // API Configuration
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5050/api'  // Development - Change port if needed
        : 'https://your-production-domain.com/api',  // Production - CHANGE THIS

    // Environment name
    NODE_ENV: window.location.hostname === 'localhost' ? 'development' : 'production',

    // Feature flags
    ENABLE_DEBUG: window.location.hostname === 'localhost',

    // App configuration
    APP_NAME: 'Mermaid Editor',
    APP_VERSION: '1.0.0'
};

// Log environment in development
if (ENV.ENABLE_DEBUG) {
    console.log('Environment:', ENV);
}
