import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../api/axios';
import './Reports.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reports/monthly');
            setReport(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load monthly report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Generating Report...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!report) return null;

    // Charts Configuration
    const categoryData = {
        labels: report.category_breakdown.map(c => c.category),
        datasets: [
            {
                label: 'Item Count',
                data: report.category_breakdown.map(c => c.item_count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const valueData = {
        labels: report.category_breakdown.map(c => c.category),
        datasets: [
            {
                label: 'Value ($)',
                data: report.category_breakdown.map(c => c.value),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                borderColor: 'rgb(53, 162, 235)',
                borderWidth: 1,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#cbd5e1' }
            },
            title: {
                display: false,
            }
        }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `$${context.raw.toLocaleString()}`
                }
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h1>Monthly Report ({new Date(report.report_date).toLocaleString('default', { month: 'long', year: 'numeric' })})</h1>
                <button className="refresh-btn" onClick={fetchReport} style={{
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

            <div className="reports-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="report-card">
                        <span className="report-value">{report.stats.total_items}</span>
                        <span className="report-label">Total Items</span>
                    </div>
                    <div className="report-card">
                        <span className="report-value">${report.stats.total_inventory_value.toLocaleString()}</span>
                        <span className="report-label">Total Value</span>
                    </div>
                    <div className="report-card">
                        <span className="report-value" style={{ color: report.stats.low_stock_count > 0 ? '#fbbf24' : '#f8fafc' }}>
                            {report.stats.low_stock_count}
                        </span>
                        <span className="report-label">Low Stock Items</span>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="charts-section">
                    <div className="chart-card">
                        <h3>Inventory by Category</h3>
                        <div className="chart-wrapper">
                            <Doughnut data={categoryData} options={chartOptions} />
                        </div>
                    </div>
                    <div className="chart-card">
                        <h3>Value by Category</h3>
                        <div className="chart-wrapper">
                            <Bar data={valueData} options={barOptions} />
                        </div>
                    </div>
                </div>

                {/* Activity Log Table */}
                <div className="activity-section">
                    <h3>Recent Activity</h3>
                    <div className="table-container">
                        {report.activities.length > 0 ? (
                            <table className="report-table">
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
                                    {report.activities.map(log => (
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
                            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                No activity recorded this month.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
