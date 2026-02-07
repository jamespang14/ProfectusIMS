import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthProvider';
import api from '../api/axios';
import './Alerts.css';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        item_id: '',
        alert_type: 'manual',
        message: ''
    });
    const { isAdmin, isManager } = useContext(AuthContext);

    useEffect(() => {
        fetchAlerts();
        fetchItems();
    }, [statusFilter]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/alerts/', { params: { status: statusFilter } });
            setAlerts(response.data);
        } catch (err) {
            setError('Failed to fetch alerts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async () => {
        try {
            const response = await api.get('/items/');
            setItems(response.data);
        } catch (err) {
            console.error('Failed to fetch items', err);
        }
    };

    const handleResolve = async (id) => {
        try {
            await api.patch(`/alerts/${id}/resolve`);
            fetchAlerts();
        } catch (err) {
            setError('Failed to resolve alert');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this alert?')) return;
        try {
            await api.delete(`/alerts/${id}`);
            fetchAlerts();
        } catch (err) {
            setError('Failed to delete alert');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData };
            if (!data.item_id) delete data.item_id;
            
            await api.post('/alerts/', data);
            setShowModal(false);
            setFormData({ item_id: '', alert_type: 'manual', message: '' });
            fetchAlerts();
        } catch (err) {
            setError('Failed to create alert');
        }
    };

    if (loading && alerts.length === 0) return <div className="loading">Loading alerts...</div>;

    return (
        <div className="alerts-container">
            <div className="alerts-header">
                <h1>Inventory Alerts</h1>
                {(isAdmin() || isManager()) && (
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        + Manual Alert
                    </button>
                )}
            </div>

            <div className="alerts-filters">
                <button 
                    className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('active')}
                >
                    Active
                </button>
                <button 
                    className={`filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('resolved')}
                >
                    Resolved
                </button>
                <button 
                    className={`filter-btn ${statusFilter === '' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('')}
                >
                    All
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-container">
                <table className="alerts-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Item</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alerts.map(alert => (
                            <tr key={alert.id}>
                                <td>
                                    <span className={`alert-type-badge type-${alert.alert_type}`}>
                                        {alert.alert_type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>{alert.item_title || 'N/A'}</td>
                                <td>{alert.message}</td>
                                <td>
                                    <span className={`status-badge status-${alert.status}`}>
                                        {alert.status}
                                    </span>
                                </td>
                                <td>{new Date(alert.created_at).toLocaleString()}</td>
                                <td className="actions">
                                    {(isAdmin() || isManager()) && alert.status === 'active' && (
                                        <button className="btn-resolve" onClick={() => handleResolve(alert.id)}>
                                            Resolve
                                        </button>
                                    )}
                                    {/* {isAdmin() && (
                                        <button className="btn-delete" onClick={() => handleDelete(alert.id)}>
                                            Delete
                                        </button>
                                    )} */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {alerts.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No alerts found.
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Create Manual Alert</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Item (Optional)</label>
                                <select 
                                    value={formData.item_id} 
                                    onChange={(e) => setFormData({...formData, item_id: e.target.value})}
                                >
                                    <option value="">No Item</option>
                                    {items.map(item => (
                                        <option key={item.id} value={item.id}>{item.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Alert Type</label>
                                <select 
                                    value={formData.alert_type} 
                                    onChange={(e) => setFormData({...formData, alert_type: e.target.value})}
                                >
                                    <option value="manual">Manual</option>
                                    <option value="low_stock">Low Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    required
                                    placeholder="Enter alert details..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit">Create Alert</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Alerts;
