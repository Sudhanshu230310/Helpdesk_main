// ============================================================
// Auth Context — Manage authentication state
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('helpdesk_token');
        const savedUser = localStorage.getItem('helpdesk_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // Login with email/password
    const login = async (email, password) => {
        const response = await API.post('/auth/login', { email, password });
        const { token: newToken, user: newUser } = response.data;

        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('helpdesk_token', newToken);
        localStorage.setItem('helpdesk_user', JSON.stringify(newUser));

        return newUser;
    };

    // LDAP login
    const ldapLogin = async (username, password) => {
        const response = await API.post('/auth/ldap-login', { username, password });
        const { token: newToken, user: newUser } = response.data;

        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('helpdesk_token', newToken);
        localStorage.setItem('helpdesk_user', JSON.stringify(newUser));

        return newUser;
    };

    // Register
    const register = async (data) => {
        const response = await API.post('/auth/register', data);
        return response.data;
    };

    // Request Access OTP
    const requestAccessOtp = async (email) => {
        return await API.post('/auth/request-access-otp', { email });
    };

    // Verify Access OTP
    const verifyAccessOtp = async (email, otp) => {
        const res = await API.post('/auth/verify-access-otp', { email, otp });
        const { token: newToken, user: userData } = res.data;
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('helpdesk_token', newToken);
        localStorage.setItem('helpdesk_user', JSON.stringify(userData));
        return res;
    };

    // Verify OTP
    const verifyOtp = async (email, otp) => {
        const response = await API.post('/auth/verify-otp', { email, otp });
        return response.data;
    };

    // Resend OTP
    const resendOtp = async (email, purpose = 'registration') => {
        const response = await API.post('/auth/resend-otp', { email, purpose });
        return response.data;
    };

    // Logout
    const logout = async () => {
        try {
            await API.post('/auth/logout');
        } catch (err) {
            // Ignore errors (e.g., token already expired)
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem('helpdesk_token');
        localStorage.removeItem('helpdesk_user');
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        ldapLogin,
        register,
        requestAccessOtp,
        verifyAccessOtp,
        verifyOtp,
        resendOtp,
        logout,
        setUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
