import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthProvider';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout, isAdmin } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <h2 className="sidebar-brand">
                    {!isCollapsed && (
                        <>
                            Profectus<span className="brand-accent">IMS</span>
                        </>
                    )}
                    {isCollapsed && <span className="brand-accent">P</span>}
                </h2>
                <button 
                    className="collapse-btn" 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label="Toggle sidebar"
                >
                    {isCollapsed ? '→' : '←'}
                </button>
            </div>
            
            <nav className="sidebar-nav">
                <Link 
                    to="/items" 
                    className={`nav-item ${location.pathname === '/items' ? 'active' : ''}`}
                >
                    <span className="nav-icon">📦</span>
                    {!isCollapsed && <span className="nav-text">Items</span>}
                </Link>
                {isAdmin() && (
                    <Link 
                        to="/users" 
                        className={`nav-item ${location.pathname === '/users' ? 'active' : ''}`}
                    >
                        <span className="nav-icon">👥</span>
                        {!isCollapsed && <span className="nav-text">Users</span>}
                    </Link>
                )}
            </nav>

            <div className="sidebar-footer">
                {!isCollapsed && (
                    <div className="user-info">
                        <div className="user-email">{user.email}</div>
                        <span className={`user-role role-${user.role}`}>{user.role}</span>
                    </div>
                )}
                <button onClick={handleLogout} className="logout-btn">
                    <span className="nav-icon">🚪</span>
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
