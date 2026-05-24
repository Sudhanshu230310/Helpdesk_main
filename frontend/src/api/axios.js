// ============================================================
// Axios Instance — API client with JWT interceptor
// ============================================================
import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const API = axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach JWT token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('helpdesk_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (expired token / session invalidation)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isSessionExpired = error.response?.data?.sessionExpired;
            localStorage.removeItem('helpdesk_token');
            localStorage.removeItem('helpdesk_user');
            // Show message if logged in from another device
            if (isSessionExpired && window.location.pathname !== '/login') {
                alert('You have been logged out because your account was logged in from another device.');
            }
            // Redirect to login if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;
