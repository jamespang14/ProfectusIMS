import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthProvider';
import api from '../api/axios';
import './Items.css';
import BulkImportModal from '../components/BulkImportModal';
import Pagination from '../components/Pagination';

const Items = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        quantity: 0,
        price: 0,
        category: ''
    });
    const { isAdmin, isManager } = useContext(AuthContext);
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [quantityItem, setQuantityItem] = useState(null);
    const [newQuantity, setNewQuantity] = useState(0);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchItems(1);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        fetchItems(currentPage);
    }, [currentPage]);

    const fetchItems = async (page = 1) => {
        try {
            setLoading(true);
            const response = await api.get('/items/', {
                params: {
                    page: page,
                    size: pageSize,
                    search: searchTerm
                }
            });
            setItems(response.data.items);
            setTotalPages(response.data.pages);
            setTotalItems(response.data.total);
            setError('');
        } catch (err) {
            setError('Failed to fetch items');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        
        try {
            await api.delete(`/items/${id}`);
            fetchItems(currentPage);
        } catch (err) {
            setError('Failed to delete item');
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...formData,
                quantity: formData.quantity === '' ? 0 : formData.quantity,
                price: formData.price === '' ? 0 : formData.price
            };
            if (editingItem) {
                await api.put(`/items/${editingItem.id}`, dataToSubmit);
            } else {
                await api.post('/items/', dataToSubmit);
            }
            setShowModal(false);
            setEditingItem(null);
            setFormData({ title: '', description: '', quantity: 0, price: 0, category: '' });
            fetchItems(currentPage);
        } catch (err) {
            setError('Failed to save item');
            console.error(err);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                title: item.title,
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                category: item.category
            });
        } else {
            setEditingItem(null);
            setFormData({ title: '', description: '', quantity: 0, price: 0, category: '' });
        }
        setShowModal(true);
    };

    const openQuantityModal = (item) => {
        setQuantityItem(item);
        setNewQuantity(item.quantity);
        setShowQuantityModal(true);
    };

    const handleQuantityUpdate = async (e) => {
        e.preventDefault();
        try {
            const qty = newQuantity === '' ? 0 : newQuantity;
            await api.patch(`/items/${quantityItem.id}/quantity`, { quantity: qty });
            setShowQuantityModal(false);
            setQuantityItem(null);
            fetchItems(currentPage);
        } catch (err) {
            setError('Failed to update quantity');
            console.error(err);
        }
    };

    const handleBulkSuccess = () => {
        fetchItems(currentPage);
    };

    if (loading && items.length === 0) return <div className="loading">Loading items...</div>;

    return (
        <div className="items-container">
            <div className="items-header">
                <h1>Inventory Items</h1>
                {(isAdmin() || isManager()) && (
                    <div className="action-buttons" style={{ display: 'flex', gap: '1rem' }}>
                        {isAdmin() && (
                            <button className="btn-secondary" onClick={() => setShowBulkImportModal(true)}>
                                📂 Bulk Import
                            </button>
                        )}
                        <button className="btn-primary" onClick={() => openModal()}>
                            + Add Item
                        </button>
                    </div>
                )}
            </div>
            
            <div className="search-bar-container" style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-container">
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            {(isAdmin() || isManager()) && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td>{item.title}</td>
                                <td>{item.description}</td>
                                <td><span className="category-badge">{item.category}</span></td>
                                <td>{item.quantity}</td>
                                <td>${item.price}</td>
                                {(isAdmin() || isManager()) && (
                                    <td className="actions">
                                        {isAdmin() && (
                                            <>
                                                <button className="btn-edit" onClick={() => openModal(item)}>Edit</button>
                                                <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                                            </>
                                        )}
                                        {isManager() && !isAdmin() && (
                                            <button className="btn-quantity" onClick={() => openQuantityModal(item)}>Update Qty</button>
                                        )}
                                        {isAdmin() && (
                                            <button className="btn-quantity" onClick={() => openQuantityModal(item)}>Update Qty</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {items.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No items found.
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
                        <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value)})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Price</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value === '' ? '' : parseInt(e.target.value)})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showQuantityModal && (
                <div className="modal-overlay" onClick={() => setShowQuantityModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Update Quantity</h2>
                        <p className="item-name">{quantityItem?.title}</p>
                        <form onSubmit={handleQuantityUpdate}>
                            <div className="form-group">
                                <label>New Quantity</label>
                                <input
                                    type="number"
                                    value={newQuantity}
                                    onChange={(e) => setNewQuantity(parseInt(e.target.value))}
                                    required
                                    min="0"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowQuantityModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBulkImportModal && (
                <BulkImportModal 
                    onClose={() => setShowBulkImportModal(false)} 
                    onSuccess={handleBulkSuccess} 
                />
            )}
        </div>
    );
};

export default Items;
