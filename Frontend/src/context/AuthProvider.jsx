import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            // Optional: Fetch user details if needed, for now just trust token existence or decode it
            // api.get('/users/me').then(res => setUser(res.data)).catch(() => logout())
             localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);
            
            const response = await api.post('/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // OAuth2 expects form data
            });
            
            const { access_token } = response.data;
            setToken(access_token);
            // After setting token, we can optionally fetch user info or just set a basic state
             setUser({ email }); 
            return true;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
