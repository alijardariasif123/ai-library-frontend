// File: frontend/src/pages/Dashboard.jsx
// Main student dashboard: quick stats + recent documents + delete option

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [docs, setDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null); // 🔥 new

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                setLoadingDocs(true);
                setError('');
                const res = await api.get('/docs');
                setDocs(res.data?.documents || []);
            } catch (err) {
                console.error('Failed to load documents:', err);
                setError('Failed to load your documents. Please try again.');
            } finally {
                setLoadingDocs(false);
            }
        };

        fetchDocs();
    }, []);

    const totalDocs = docs.length;
    const readyDocs = docs.filter((d) => d.status === 'ready').length;
    const processingDocs = docs.filter((d) => d.status === 'processing').length;
    const errorDocs = docs.filter((d) => d.status === 'error').length;

    const goToUpload = () => navigate('/upload');
    const goToChat = () => navigate('/chat');

    // 🗑 Delete doc from dashboard
    const handleDelete = async (docId) => {
        const confirmDelete = window.confirm('Kya aap sure ho ki ye document delete karna hai?');
        if (!confirmDelete) return;

        try {
            setDeletingId(docId);
            setError('');
            await api.delete(`/docs/${docId}`);
            setDocs((prev) => prev.filter((d) => d._id !== docId));
        } catch (err) {
            console.error('Failed to delete doc from dashboard:', err);
            setError(
                err?.response?.data?.message ||
                'Failed to delete document. Please try again.'
            );
        } finally {
            setDeletingId(null);
        }
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

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="dashboard-grid">
            {/* Left: Study snapshot + documents */}
            <section className="dashboard-grid__left card">
                <header className="card-header">
                    <div>
                        <h2 className="card-title">Hi, {user?.name?.split(' ')[0] || 'Student'} 👋</h2>
                        <p className="card-subtitle">
                            Here&apos;s a quick snapshot of your study material and AI-ready documents.
                        </p>
                    </div>
                    <span className="card-badge">
                        {user?.plan === 'premium' ? 'Premium Plan Active' : 'Free Plan'}
                    </span>
                </header>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-label">Total docs</div>
                        <div className="stat-value">{totalDocs}</div>
                        <div className="stat-tag">Uploaded so far</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">AI-ready</div>
                        <div className="stat-value">{readyDocs}</div>
                        <div className="stat-tag">Can ask questions now</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Processing</div>
                        <div className="stat-value">{processingDocs}</div>
                        <div className="stat-tag">OCR + AI reading</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Errors</div>
                        <div className="stat-value">{errorDocs}</div>
                        <div className="stat-tag">Need re-upload/fix</div>
                    </div>
                </div>

                {/* Call-to-action buttons */}
                <div style={{ marginTop: '1.1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button className="btn btn--primary" onClick={goToUpload}>
                        + Upload new material
                    </button>
                    {readyDocs > 0 && (
                        <button className="btn btn--ghost" onClick={goToChat}>
                            Ask AI from your notes
                        </button>
                    )}
                </div>

                {/* Recent documents */}
                <div style={{ marginTop: '1.4rem' }}>
                    <div className="card-header" style={{ marginBottom: '0.4rem' }}>
                        <div>
                            <div className="card-title" style={{ fontSize: '1rem' }}>
                                Recent documents
                            </div>
                            <div className="card-subtitle">
                                Upload your book, module or notes here – AI will read and prepare them for chat.
                            </div>
                        </div>
                    </div>

                    {loadingDocs && (
                        <div className="form-helper" style={{ marginTop: '0.5rem' }}>
                            Loading your documents…
                        </div>
                    )}

                    {error && (
                        <div className="form-error" style={{ marginTop: '0.5rem' }}>
                            {error}
                        </div>
                    )}

                    {!loadingDocs && !error && docs.length === 0 && (
                        <div className="form-helper" style={{ marginTop: '0.6rem' }}>
                            You haven&apos;t uploaded any document yet. Start by clicking{' '}
                            <span className="code-tag">+ Upload new material</span>.
                        </div>
                    )}

                    {docs.length > 0 && (
                        <div className="doc-list">
                            {docs.slice(0, 6).map((doc) => (
                                <div className="doc-card" key={doc._id}>
                                    <div className="doc-main">
                                        <div className="doc-title">{doc.filename}</div>
                                        <div className="doc-meta">
                                            Uploaded: {formatDate(doc.createdAt)} &nbsp;•&nbsp; Size:{' '}
                                            {(doc.size / (1024 * 1024)).toFixed(2)} MB
                                        </div>
                                    </div>
                                    <div className="doc-actions">
                                        <span className={statusBadgeClass(doc.status)}>
                                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                        </span>
                                        {doc.status === 'ready' && (
                                            <button
                                                className="btn btn--ghost"
                                                onClick={() => navigate('/chat', { state: { documentId: doc._id } })}
                                            >
                                                Ask AI
                                            </button>
                                        )}
                                        <button
                                            className="btn btn--ghost"
                                            type="button"
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
                </div>
            </section>

            {/* Right: Study tips / quick guide */}
            <section className="dashboard-grid__right card card--soft">
                <header className="card-header">
                    <div>
                        <h2 className="card-title">How to use Study Assistant AI?</h2>
                        <p className="card-subtitle">3-step shortcut to score more in less time.</p>
                    </div>
                </header>

                <ol className="auth-hero-list" style={{ marginTop: '0.2rem' }}>
                    <li>Upload your subject book, unit PDF or handwritten scanned notes.</li>
                    <li>
                        Wait till the status becomes <span className="code-tag">ready</span> – AI has read your
                        material.
                    </li>
                    <li>
                        Go to <span className="code-tag">AI Tutor</span> and:
                        <ul className="plan-feature-list" style={{ marginTop: '0.45rem' }}>
                            <li>Ask for chapter-wise summary</li>
                            <li>Generate most important exam topics</li>
                            <li>Ask doubt in English or Hindi</li>
                            <li>Generate MCQs for self-testing</li>
                        </ul>
                    </li>
                </ol>

                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-soft)' }}>
                    Pro tip: Use this with your <strong>university previous year papers</strong> – upload PYQ
                    PDF, then ask AI to map questions to topics from your book.
                </div>
            </section>
        </div>
    );
}

export default Dashboard;
