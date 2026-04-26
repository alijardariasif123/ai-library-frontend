// File: frontend/src/pages/Upload.jsx
// PRO VERSION: auto refresh + anti double upload + stable UX

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
    const [deletingId, setDeletingId] = useState(null);

    const fileInputRef = useRef(null);
    const refreshRef = useRef(null);

    /**
     * ==========================
     * LOAD DOCS
     * ==========================
     */
    const fetchDocs = async (silent = false) => {
        try {
            if (!silent) setLoadingDocs(true);

            const res = await api.get('/docs');
            const docs = res.data?.documents || [];

            setRecentDocs(docs);

            const hasProcessing = docs.some(
                (d) => d.status === 'processing' || d.status === 'queued'
            );

            if (hasProcessing && !refreshRef.current) {
                refreshRef.current = setInterval(() => {
                    fetchDocs(true);
                }, 5000);
            }

            if (!hasProcessing && refreshRef.current) {
                clearInterval(refreshRef.current);
                refreshRef.current = null;
            }

        } catch (err) {
            console.error('Fetch docs failed', err);
        } finally {
            if (!silent) setLoadingDocs(false);
        }
    };

    useEffect(() => {
        fetchDocs();

        return () => {
            if (refreshRef.current) {
                clearInterval(refreshRef.current);
            }
        };
    }, []);

    /**
     * ==========================
     * FILE PICK
     * ==========================
     */
    const onBrowseClick = () => {
        if (!uploading) fileInputRef.current?.click();
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
            setErrorMsg('Only PDF or image files allowed.');
            setSelectedFile(null);
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setErrorMsg('Max file size is 50MB.');
            setSelectedFile(null);
            return;
        }

        setErrorMsg('');
        setMessage('');
        setSelectedFile(file);
    };

    /**
     * ==========================
     * DRAG DROP
     * ==========================
     */
    const handleDragOver = (e) => {
        e.preventDefault();
        if (!uploading) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (uploading) return;

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        validateAndSetFile(file);
    };

    /**
     * ==========================
     * UPLOAD
     * ==========================
     */
    const handleUpload = async () => {
        if (uploading) return;

        if (!selectedFile) {
            setErrorMsg('Please choose a file first.');
            return;
        }

        try {
            setUploading(true);
            setErrorMsg('');
            setMessage('Uploading file...');

            const formData = new FormData();
            formData.append('file', selectedFile);

            const res = await api.post('/docs/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSelectedFile(null);
            setMessage(
                res.data?.message ||
                'Upload successful. AI processing started.'
            );

            await fetchDocs(true);

        } catch (err) {
            console.error(err);

            setErrorMsg(
                err?.response?.data?.message ||
                'Upload failed. Try again.'
            );

        } finally {
            setUploading(false);
        }
    };

    /**
     * ==========================
     * DELETE
     * ==========================
     */
    const handleDelete = async (docId) => {
        const yes = window.confirm('Delete this document?');
        if (!yes) return;

        try {
            setDeletingId(docId);

            await api.delete(`/docs/${docId}`);

            setRecentDocs((prev) =>
                prev.filter((item) => item._id !== docId)
            );

            setMessage('Document deleted.');

        } catch (err) {
            setErrorMsg(
                err?.response?.data?.message ||
                'Delete failed.'
            );
        } finally {
            setDeletingId(null);
        }
    };

    /**
     * ==========================
     * HELPERS
     * ==========================
     */
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
            case 'queued':
                return 'badge badge--processing';
            case 'error':
                return 'badge badge--error';
            default:
                return 'badge badge--uploaded';
        }
    };

    /**
     * ==========================
     * UI
     * ==========================
     */
    return (
        <div className="upload-layout">
            <section className="card">
                <header className="card-header">
                    <div>
                        <h2 className="card-title">Upload study material</h2>
                        <p className="card-subtitle">
                            PDF, notes, scanned pages.
                        </p>
                    </div>
                    <span className="card-badge">
                        Max 50MB
                    </span>
                </header>

                <div
                    className={`upload-dropzone ${uploading ? 'disabled' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="upload-icon">
                        <span>↑</span>
                    </div>

                    <div className="upload-title">
                        {selectedFile
                            ? selectedFile.name
                            : 'Drop file here or browse'}
                    </div>

                    <div className="upload-subtitle">
                        {selectedFile
                            ? formatSize(selectedFile.size)
                            : 'PDF / JPG / PNG / WEBP'}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                    />

                    <div className="upload-button-row">
                        <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={onBrowseClick}
                            disabled={uploading}
                        >
                            Choose File
                        </button>

                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading
                                ? 'Uploading...'
                                : 'Upload'}
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="form-error" style={{ marginTop: 14 }}>
                        {errorMsg}
                    </div>
                )}

                {message && !errorMsg && (
                    <div className="form-helper" style={{ marginTop: 14 }}>
                        {message}
                    </div>
                )}
            </section>

            <section className="card card--soft">
                <header className="card-header">
                    <div>
                        <h2 className="card-title">Recent uploads</h2>
                        <p className="card-subtitle">
                            Auto refresh every 5 sec while processing.
                        </p>
                    </div>
                </header>

                {loadingDocs && (
                    <div className="form-helper">
                        Loading...
                    </div>
                )}

                {!loadingDocs && recentDocs.length === 0 && (
                    <div className="form-helper">
                        No uploads yet.
                    </div>
                )}

                {!loadingDocs && recentDocs.length > 0 && (
                    <div className="doc-list">
                        {recentDocs.slice(0, 10).map((doc) => (
                            <div className="doc-card" key={doc._id}>
                                <div className="doc-main">
                                    <div className="doc-title">
                                        {doc.filename}
                                    </div>

                                    <div className="doc-meta">
                                        {formatDate(doc.createdAt)} · {formatSize(doc.size)}
                                    </div>
                                </div>

                                <div className="doc-actions">
                                    <span className={statusBadgeClass(doc.status)}>
                                        {doc.status}
                                    </span>

                                    <button
                                        type="button"
                                        className="btn btn--ghost"
                                        onClick={() => handleDelete(doc._id)}
                                        disabled={deletingId === doc._id}
                                    >
                                        {deletingId === doc._id
                                            ? 'Deleting...'
                                            : 'Delete'}
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