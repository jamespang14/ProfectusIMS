import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AuditLogs.css';
import Pagination from '../components/Pagination';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage]);

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const response = await api.get('/audit-logs/', {
                params: {
                    page: page,
                    size: pageSize
                }
            });
            setLogs(response.data.items);
            setTotalPages(response.data.pages);
            setTotalItems(response.data.total);
            setError('');
        } catch (err) {
            setError('Failed to fetch audit logs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatAction = (action) => {
        return action ? action.toLowerCase() : '';
    };

    if (loading && logs.length === 0) return <div className="loading">Loading audit logs...</div>;

    return (
        <div className="audit-logs-container">
            <div className="audit-logs-header">
                <h1>Audit Logs</h1>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-container">
                <table className="audit-logs-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>ID</th>
                            <th>User ID</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td>{new Date(log.timestamp).toLocaleString()}</td>
                                <td>
                                    <span className={`action-badge action-${formatAction(log.action)}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td>
                                    <span className="entity-badge">{log.entity_type}</span>
                                </td>
                                <td>{log.entity_id}</td>
                                <td>{log.user_id}</td>
                                <td className="details-popover" title={log.details}>
                                    {log.details || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No audit logs found.
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
        </div>
    );
};

export default AuditLogs;
