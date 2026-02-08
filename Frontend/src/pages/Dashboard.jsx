import React, { useState, useEffect, useContext } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../api/axios';
import AuthContext from '../context/AuthProvider';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
    const { isAdmin } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            await Promise.all([
                fetchStats(),
                fetchActivity()
            ]);
        } catch (err) {
            console.error(err);
            // Error is handled in individual fetchers or here
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/dashboard/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
            setError('Failed to load dashboard data');
        }
    };

    const fetchActivity = async () => {
        if (!isAdmin()) return;
        try {
            const response = await api.get('/audit-logs/', {
                params: { page: 1, size: 5 }
            });
            setActivities(response.data.items);
        } catch (err) {
            console.error('Failed to fetch activity', err);
            // Don't block whole dashboard if activity log fails
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;
    if (error) return <div className="error-banner">{error}</div>;
    if (!stats) return null;

    // Prepare chart data
    const prepareChartData = () => {
        const allTimestamps = new Set();
        stats.item_stats.forEach(item => {
            item.history.forEach(point => {
                allTimestamps.add(new Date(point.timestamp).toLocaleString());
            });
        });
        
        const labels = Array.from(allTimestamps).sort((a, b) => new Date(a) - new Date(b));
        
        const colors = [
            'rgb(255, 99, 132)',
            'rgb(53, 162, 235)',
            'rgb(75, 192, 192)',
        ];
        
        return {
            labels: labels.length > 0 ? labels : ['No Data'], 
            datasets: stats.item_stats.map((item, index) => {
                const data = labels.map(label => {
                    const match = item.history.find(h => new Date(h.timestamp).toLocaleString() === label);
                    if (match) return match.quantity;
                    
                    const labelTime = new Date(label).getTime();
                    const previousPoints = item.history.filter(h => new Date(h.timestamp).getTime() <= labelTime);
                    if (previousPoints.length > 0) {
                        return previousPoints[previousPoints.length - 1].quantity;
                    }
                    return null;
                });

                return {
                    label: item.title,
                    data: data,
                    borderColor: colors[index % colors.length],
                    backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
                    tension: 0.3
                };
            })
        };
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
                color: '#cbd5e1'
            }
          },
          title: {
            display: false
          },
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const chartData = prepareChartData();

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <button className="refresh-btn" onClick={fetchAllData} style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}>
                    Refresh
                </button>
            </div>

            <div className="dashboard-content">
                <div className="dashboard-stats-grid">
                    <div className="stat-card">
                        <span className="stat-value">{stats.summary.total_items}</span>
                        <span className="stat-label">Total Items</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: '#f87171' }}>{stats.summary.out_of_stock}</span>
                        <span className="stat-label">Out of Stock</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: '#fbbf24' }}>{stats.summary.low_stock}</span>
                        <span className="stat-label">Low Stock</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: '#60a5fa' }}>{stats.summary.active_alerts}</span>
                        <span className="stat-label">Active Alerts</span>
                    </div>
                </div>

                <div className="chart-container">
                    <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '1rem' }}>Quantity Trends (Top 3 Items)</h3>
                    <div className="chart-wrapper">
                        {stats.item_stats.length > 0 ? (
                            <Line options={options} data={chartData} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                Not enough data to display trends.
                            </div>
                        )}
                    </div>
                </div>

                {isAdmin() && (
                    <div className="activity-section">
                        <h3>Recent Activity</h3>
                        <div className="table-container">
                            {activities.length > 0 ? (
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Action</th>
                                            <th>Entity</th>
                                            <th>ID</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.map(log => (
                                            <tr key={log.id}>
                                                <td>{formatDate(log.timestamp)}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        background: log.action === 'CREATE' ? 'rgba(34, 197, 94, 0.2)' : 
                                                                    log.action === 'DELETE' ? 'rgba(239, 68, 68, 0.2)' : 
                                                                    'rgba(59, 130, 246, 0.2)',
                                                        color: log.action === 'CREATE' ? '#4ade80' : 
                                                               log.action === 'DELETE' ? '#f87171' : 
                                                               '#60a5fa'
                                                    }}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td>{log.entity_type}</td>
                                                <td>{log.entity_id}</td>
                                                <td>{log.details || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                                    No recent activity.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
