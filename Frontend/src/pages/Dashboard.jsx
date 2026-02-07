import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../api/axios';
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
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard/stats');
            setStats(response.data);
        } catch (err) {
            setError('Failed to fetch dashboard stats');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;
    if (error) return <div className="error-banner">{error}</div>;
    if (!stats) return null;

    // Prepare chart data
    const prepareChartData = () => {
        // Collect all unique timestamps from all items
        const allTimestamps = new Set();
        stats.item_stats.forEach(item => {
            item.history.forEach(point => {
                allTimestamps.add(new Date(point.timestamp).toLocaleString());
            });
        });
        
        // Convert to sorted array
        const labels = Array.from(allTimestamps).sort((a, b) => new Date(a) - new Date(b));
        
        // Colors for the lines
        const colors = [
            'rgb(255, 99, 132)', // Red
            'rgb(53, 162, 235)', // Blue
            'rgb(75, 192, 192)', // Teal
        ];
        
        const datasets = stats.item_stats.map((item, index) => {
            // Map history to the global labels timeline
            // Since we might have missing points, we need to handle that.
            // But Chart.js line chart usually expects matching data points to labels.
            // A better way given mixed timestamps is to use a linearly distributed x-axis if we had a time scale adapter,
            // but for simplicity with CategoryScale, let's just map the history we have.
            
            // To make it look continuous, we can fill missing leading values with the first known value?
            // Or just plot the points we have.
            // Actually, for a multi-line chart with different timestamps, it's best to either:
            // 1. Use 'time' scale (requires date adapter).
            // 2. Or simplified: Just use the sequence of changes for each item? No, they won't align.
            
            // Let's stick to a simple representation:
            // Just map the history points we have to x, y. 
            // NOTE: Chart.js strict category scale might not perfectly permit "x/y" objects without a time scale.
            // Let's try to pass the labels as just the index 1, 2, 3... or just use the local timestamps.
            
            // Alternative: Simply show the LAST N changes?
            
            // Let's try to just map the data points directly.
            // If we use 'index' as labels.
            
            return {
                label: item.title,
                data: item.history.map(h => ({
                    x: new Date(h.timestamp).toLocaleString(),
                    y: h.quantity
                })),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
                tension: 0.1
            };
        });

        return {
            // labels, // If we provide data as {x, y} we might not need explicit labels if we weren't using category scale.
            // But we ARE using CategoryScale. To properly align, we really should have a unified set of labels.
            labels: labels.length > 0 ? labels : ['No Data'], 
            datasets: stats.item_stats.map((item, index) => {
                // We need to map our history to the unified "labels" array.
                // For each label (timestamp), find the value at that time.
                // If no exact match, use the previous known value (step).
                
                const data = labels.map(label => {
                    // Find the state at this timestamp
                    // Exact match?
                    const match = item.history.find(h => new Date(h.timestamp).toLocaleString() === label);
                    if (match) return match.quantity;
                    
                    // Previous known?
                    // This is getting complex for Frontend.
                    // Let's simplifying: Just plot the raw points and let Chart.js interpolation handle it?
                    // No, Category scale requires matching.
                    
                    // Simple fallback: If match found, return it. If not, return null (gap) or previous.
                    // Let's try returning the closest previous value.
                    
                    // Filter history for points <= label
                    const labelTime = new Date(label).getTime();
                    const previousPoints = item.history.filter(h => new Date(h.timestamp).getTime() <= labelTime);
                    if (previousPoints.length > 0) {
                        return previousPoints[previousPoints.length - 1].quantity;
                    }
                    return null; // Should not happen if history includes current state and we sort right.
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
            display: true,
            text: 'Quantity Trends (Top 3 Active Items)',
            color: '#e2e8f0'
          },
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#94a3b8'
                }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#94a3b8'
                }
            }
        }
    };

    const chartData = prepareChartData();

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
            </div>

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
                {stats.item_stats.length > 0 ? (
                    <div className="chart-wrapper">
                        <Line options={options} data={chartData} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                        Not enough data to display trends.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
