import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './Users.css';
import Pagination from '../components/Pagination';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        fetchUsers(currentPage);
    }, [currentPage]);

    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const response = await api.get('/users/', {
                params: {
                    page: page,
                    size: pageSize
                }
            });
            setUsers(response.data.items);
            setTotalPages(response.data.pages);
            setTotalItems(response.data.total);
            setError('');
        } catch (err) {
            setError('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        
        try {
            await api.delete(`/users/${userId}`);
            fetchUsers(currentPage);
        } catch (err) {
            setError('Failed to delete user');
            console.error(err);
        }
    };

    const handleUpdateRole = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/users/${selectedUser.id}/role`, { role: newRole });
            setShowModal(false);
            setSelectedUser(null);
            setNewRole('');
            fetchUsers(currentPage);
        } catch (err) {
            setError('Failed to update role');
            console.error(err);
        }
    };

    const openRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowModal(true);
    };

    if (loading && users.length === 0) return <div className="loading">Loading users...</div>;

    return (
        <div className="users-container">
            <div className="users-header">
                <h1>User Management</h1>
                <span className="admin-badge">Admin Only</span>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="actions">
                                    <button className="btn-edit" onClick={() => openRoleModal(user)}>
                                        Change Role
                                    </button>
                                    <button className="btn-delete" onClick={() => handleDeleteUser(user.id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No users found.
                    </div>
                )}
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Update User Role</h2>
                        <p className="user-email">{selectedUser?.email}</p>
                        <form onSubmit={handleUpdateRole}>
                            <div className="form-group">
                                <label>Select Role</label>
                                <select 
                                    value={newRole} 
                                    onChange={(e) => setNewRole(e.target.value)}
                                    required
                                >
                                    <option value="VIEWER">Viewer</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Update Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
