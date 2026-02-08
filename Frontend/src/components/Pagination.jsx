import React from 'react';
import './Pagination.css';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    totalItems, 
    pageSize, 
    onPageChange 
}) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
            </div>
            <div className="pagination-controls">
                <button 
                    className="page-btn nav-btn"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="First Page"
                >
                    &laquo;
                </button>
                <button 
                    className="page-btn nav-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous Page"
                >
                    &lsaquo;
                </button>
                
                {getPageNumbers().map(page => (
                    <button
                        key={page}
                        className={`page-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}
                
                <button 
                    className="page-btn nav-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                >
                    &rsaquo;
                </button>
                <button 
                    className="page-btn nav-btn"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last Page"
                >
                    &raquo;
                </button>
            </div>
        </div>
    );
};

export default Pagination;
