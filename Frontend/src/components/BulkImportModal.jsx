import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import api from '../api/axios';
import './BulkImportModal.css';

const BulkImportModal = ({ onClose, onSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [parsedData, setParsedData] = useState([]);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    // Validate columns
                    const requiredColumns = ['title', 'description', 'price', 'quantity', 'category'];
                    const headers = results.meta.fields;
                    
                    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
                    
                    if (missingColumns.length > 0) {
                        setError(`Missing columns: ${missingColumns.join(', ')}`);
                        setParsedData([]);
                        return;
                    }

                    // Validate data types (basic)
                    const validData = results.data.map(row => ({
                        ...row,
                        price: parseInt(row.price) || 0,
                        quantity: parseInt(row.quantity) || 0
                    }));

                    setParsedData(validData);
                    setError('');
                },
                error: (err) => {
                    setError('Failed to parse CSV file');
                    console.error(err);
                }
            });
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv']
        },
        multiple: false
    });

    const handleImport = async () => {
        if (parsedData.length === 0) return;

        try {
            setUploading(true);
            const response = await api.post('/items/bulk', parsedData);
            setSuccessMsg(`Successfully imported ${response.data.length} items`);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setError('Failed to import items. Check server logs.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        // 1. Define the headers and data
        const headers = ['title', 'description', 'price', 'quantity', 'category'];
        const row = ["Example Item", "Details here", 100, 50, "Electronics"];
        
        // 2. Format as CSV string
        const csvContent = [
            headers.join(','), 
            row.join(',')
        ].join('\n');

        // 3. Create a Blob with an explicit MIME type
        // The \uFEFF ensures Excel/Numbers on Mac reads it as UTF-8
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // 4. Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template.csv');
        
        // 5. Append to body, click, and cleanup
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up memory
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content bulk-import-modal" onClick={e => e.stopPropagation()}>
                <h2>Bulk Import Items</h2>
                
                <div className="template-section">
                    <div className="template-info">
                        <h3>1. Download Template</h3>
                        <p>Use this CSV file as a starting point</p>
                    </div>
                    <button 
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="btn-download"
                        style={{ 
                            textDecoration: 'none', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            color: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>⬇️</span> Download CSV
                    </button>
                </div>

                <h3>2. Upload CSV</h3>
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    <span className="dropzone-icon">📄</span>
                    {isDragActive ? (
                        <p>Drop the file here ...</p>
                    ) : (
                        <p>Drag & drop your CSV file here, or click to select</p>
                    )}
                </div>

                {error && <div className="validation-error">{error}</div>}
                {successMsg && <div className="success-banner" style={{ color: '#4ade80', marginTop: '1rem' }}>{successMsg}</div>}

                {parsedData.length > 0 && !successMsg && (
                    <div className="import-preview">
                        <table className="preview-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.slice(0, 5).map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.title}</td>
                                        <td>{row.quantity}</td>
                                        <td>${row.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {parsedData.length > 5 && <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>...and {parsedData.length - 5} more</p>}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button 
                        className="btn-submit" 
                        onClick={handleImport}
                        disabled={parsedData.length === 0 || uploading}
                        style={{ opacity: parsedData.length === 0 || uploading ? 0.5 : 1 }}
                    >
                        {uploading ? 'Importing...' : `Import ${parsedData.length > 0 ? parsedData.length : ''} Items`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
