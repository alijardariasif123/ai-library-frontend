// File: frontend/src/pages/Upload.jsx
// Upload page: drag & drop area + recent uploads + delete option

import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

function UploadPage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [recentDocs, setRecentDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [deletingId, setDeletingId] = useState(null); // 🔥 new

    const fileInputRef = useRef(null);

    // Load recent docs
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                setLoadingDocs(true);
                const res = await api.get('/docs');
                setRecentDocs(res.data?.documents || []);
            } catch (err) {
                console.error('Failed to fetch docs on upload page', err);
            } finally {
                setLoadingDocs(false);
            }
        };

        fetchDocs();
    }, []);

    const onBrowseClick = () => {
        fileInputRef.current?.click();
    };

    

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        validateAndSetFile(file);
    };

    const validateAndSetFile = (file) => {
        const allowedTypes = [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/bmp',
            'image/tiff',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {
            setErrorMsg('Only PDF and image files (PNG, JPG, JPEG, BMP, TIFF, WEBP) are allowed.');
            setSelectedFile(null);
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setErrorMsg('File size limit is 50MB.');
            setSelectedFile(null);
            return;
        }

        setErrorMsg('');
        setMessage('');
        setSelectedFile(file);
    };

    // Drag & Drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        validateAndSetFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setErrorMsg('Please select a file first.');
            return;
        }

        try {
            setUploading(true);
            setErrorMsg('');
            setMessage('');

            const formData = new FormData();
            formData.append('file', selectedFile);

            const res = await api.post('/docs/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage(res.data?.message || 'Document uploaded successfully.');
            setSelectedFile(null);

            // Refresh recent docs
            const docsRes = await api.get('/docs');
            setRecentDocs(docsRes.data?.documents || []);
        } catch (err) {
            console.error('Upload failed:', err);
            setErrorMsg(
                err?.response?.data?.message || 'Failed to upload document. Please try again in a moment.'
            );
        } finally {
            setUploading(false);
        }
    };

    // 🗑 Delete document
    const handleDelete = async (docId) => {
        const confirmDelete = window.confirm('Kya aap sure ho ki ye document delete karna hai?');
        if (!confirmDelete) return;

        try {
            setDeletingId(docId);
            setErrorMsg('');
            setMessage('');

            await api.delete(`/docs/${docId}`);

            // Frontend list se hata do
            setRecentDocs((prev) => prev.filter((d) => d._id !== docId));
            setMessage('Document delete ho gaya.');
        } catch (err) {
            console.error('Failed to delete doc:', err);
            setErrorMsg(
                err?.response?.data?.message || 'Failed to delete document. Please try again later.'
            );
        } finally {
            setDeletingId(null);
        }
    };

    const formatSize = (size) => {
        if (!size && size !== 0) return '—';
        const mb = size / (1024 * 1024);
        if (mb < 1) {
            return `${(size / 1024).toFixed(1)} KB`;
        }
        return `${mb.toFixed(2)} MB`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleString(undefined, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusBadgeClass = (status) => {
        switch (status) {
            case 'ready':
                return 'badge badge--ready';
            case 'processing':
                return 'badge badge--processing';
            case 'error':
                return 'badge badge--error';
            case 'uploaded':
            default:
                return 'badge badge--uploaded';
        }
    };

    return (
        <div className="upload-layout">
            {/* Left: upload panel */}
            <section className="card">
                <header className="card-header">
                    <div>
                        <h2 className="card-title">Upload study material</h2>
                        <p className="card-subtitle">
                            Add your book PDF, module, or scanned notes. AI will read and prepare them for chat.
                        </p>
                    </div>
                    <span className="card-badge">Max 50MB · PDF / images</span>
                </header>

                <div
                    className="upload-dropzone"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={
                        isDragging
                            ? {
                                borderColor: 'rgba(255, 111, 177, 0.9)',
                                boxShadow: '0 18px 45px rgba(255, 111, 177, 0.9)'
                            }
                            : undefined
                    }
                >
                    <div className="upload-icon">
                        <span>↑</span>
                    </div>
                    <div className="upload-title">
                        {selectedFile ? selectedFile.name : 'Drop your file here or browse'}
                    </div>
                    <div className="upload-subtitle">
                        {selectedFile
                            ? `Size: ${formatSize(selectedFile.size)}`
                            : 'Supported formats: PDF, PNG, JPG, JPEG, BMP, TIFF, WEBP'}
                    </div>

                    <div className="upload-pill-row">
                        <span className="upload-pill">DBMS textbook</span>
                        <span className="upload-pill">Unit-wise PDF</span>
                        <span className="upload-pill">Handwritten notes (scanned)</span>
                        <span className="upload-pill">Previous year paper</span>
                    </div>

                    <input
                        type="file"
                        accept=".pdf,image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    <div className="upload-button-row">
                        <button type="button" className="btn btn--ghost" onClick={onBrowseClick}>
                            Choose file
                        </button>
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading & sending to AI…' : 'Upload & send to AI'}
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="form-error" style={{ marginTop: '0.85rem' }}>
                        {errorMsg}
                    </div>
                )}

                {message && !errorMsg && (
                    <div className="form-helper" style={{ marginTop: '0.85rem' }}>
                        {message}
                    </div>
                )}

                <div className="form-helper" style={{ marginTop: '1rem' }}>
                    Tip: Best results when you upload one book or one unit per file. For very large books,
                    split into 2–3 parts.
                </div>
            </section>

            {/* Right: recent uploads summary */}
            <section className="card card--soft">
                <header className="card-header">
                    <div>
                        <h2 className="card-title">Recent uploads</h2>
                        <p className="card-subtitle">
                            Track the processing status of your latest documents here. You can also delete files.
                        </p>
                    </div>
                </header>

                {loadingDocs && (
                    <div className="form-helper" style={{ marginTop: '0.4rem' }}>
                        Loading recent uploads…
                    </div>
                )}

                {!loadingDocs && recentDocs.length === 0 && (
                    <div className="form-helper" style={{ marginTop: '0.4rem' }}>
                        No uploads yet. Once you upload, they will appear here with their AI processing status.
                    </div>
                )}

                {!loadingDocs && recentDocs.length > 0 && (
                    <div className="doc-list">
                        {recentDocs.slice(0, 8).map((doc) => (
                            <div className="doc-card" key={doc._id}>
                                <div className="doc-main">
                                    <div className="doc-title">{doc.filename}</div>
                                    <div className="doc-meta">
                                        {formatDate(doc.createdAt)} · {formatSize(doc.size)}
                                    </div>
                                </div>
                                <div className="doc-actions">
                                    <span className={statusBadgeClass(doc.status)}>
                                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn--ghost"
                                        onClick={() => handleDelete(doc._id)}
                                        disabled={deletingId === doc._id}
                                    >
                                        {deletingId === doc._id ? 'Deleting…' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default UploadPage;
