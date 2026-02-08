import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthProvider';
import api from '../api/axios';
import './Alerts.css';
import Pagination from '../components/Pagination';

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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        fetchAlerts(currentPage, statusFilter);
        fetchItems();
    }, [currentPage, statusFilter]);

    const fetchAlerts = async (page = 1, filter = statusFilter) => {
        try {
            setLoading(true);
            const params = {
                page: page,
                size: pageSize
            };
            if (filter) {
                params.status = filter;
            }
            
            const response = await api.get('/alerts/', { params });
            setAlerts(response.data.items);
            setTotalPages(response.data.pages);
            setTotalItems(response.data.total);
            setError('');
        } catch (err) {
            setError('Failed to fetch alerts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async () => {
        try {
            // Fetching all items for dropdown, might need separate non-paginated endpoint or large limit
            // For now, assuming standard fetch is okay or we implement search later.
            // Using a large limit or relying on current endpoint which now paginates?
            // If /items/ is paginated by default, we only get first 20. 
            // We should arguably have an autocomplete or search for item selection.
            // For simplicity in this task, let's request a larger size for dropdowns if possible, or leave as is.
            const response = await api.get('/items/', { params: { size: 100 } }); 
            setItems(response.data.items);
        } catch (err) {
            console.error('Failed to fetch items', err);
        }
    };

    const handleResolve = async (id) => {
        try {
            await api.patch(`/alerts/${id}/resolve`);
            fetchAlerts(currentPage, statusFilter);
        } catch (err) {
            setError('Failed to resolve alert');
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
            fetchAlerts(1, statusFilter); // Reset to first page
            setCurrentPage(1);
        } catch (err) {
            setError('Failed to create alert');
        }
    };

    const handleFilterChange = (newFilter) => {
        setStatusFilter(newFilter);
        setCurrentPage(1);
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
                    onClick={() => handleFilterChange('active')}
                >
                    Active
                </button>
                <button 
                    className={`filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('resolved')}
                >
                    Resolved
                </button>
                <button 
                    className={`filter-btn ${statusFilter === '' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('')}
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
