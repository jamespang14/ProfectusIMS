import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AuditLogs.css';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/audit-logs/');
            setLogs(response.data);
        } catch (err) {
            setError('Failed to fetch audit logs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatAction = (action) => {
        return action.toLowerCase();
    };

    if (loading) return <div className="loading">Loading audit logs...</div>;

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
            </div>
        </div>
    );
};

export default AuditLogs;
