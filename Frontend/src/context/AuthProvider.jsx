import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // Fetch user details to get role
            fetchUserDetails();
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/me');
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user details", error);
            // If fetching user fails, logout
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);
            
            const response = await api.post('/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const { access_token } = response.data;
            setToken(access_token);
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

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    const isManager = () => {
        return user?.role === 'manager' || user?.role === 'admin';
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, isAdmin, isManager }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
