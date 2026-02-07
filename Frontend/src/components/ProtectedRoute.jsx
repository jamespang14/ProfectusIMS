import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthProvider';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { token, user, isAdmin } = useContext(AuthContext);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin()) {
        return <Navigate to="/items" replace />;
    }

    // Show loading state while user details are being fetched
    if (!user) {
        return <div>Loading...</div>;
    }

    return children;
};

export default ProtectedRoute;
