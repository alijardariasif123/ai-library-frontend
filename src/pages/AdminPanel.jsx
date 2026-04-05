// File: frontend/src/pages/AdminPanel.jsx
// Admin dashboard: system overview + users table + documents table + reprocess button

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function AdminPanel() {
    const [overview, setOverview] = useState(null);
    const [users, setUsers] = useState([]);
    const [docs, setDocs] = useState([]);
    const [loadingOverview, setLoadingOverview] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [reprocessingId, setReprocessingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            setErrorMsg('');
            try {
                setLoadingOverview(true);
                setLoadingUsers(true);
                setLoadingDocs(true);

                const [oRes, uRes, dRes] = await Promise.all([
                    api.get('/admin/overview'),
                    api.get('/admin/users'),
                    api.get('/admin/documents')
                ]);

                setOverview(oRes.data?.overview || null);
                setUsers(uRes.data?.users || []);
                setDocs(dRes.data?.documents || []);
            } catch (err) {
                console.error('Admin panel load error:', err);
                setErrorMsg(
                    err?.response?.data?.message || 'Failed to load admin data. Check your admin token & backend logs.'
                );
            } finally {
                setLoadingOverview(false);
                setLoadingUsers(false);
                setLoadingDocs(false);
            }
        };

        fetchAll();
    }, []);

    const handleReprocess = async (docId) => {
        try {
            setReprocessingId(docId);
            setErrorMsg('');
            await api.post(`/admin/reprocess/${docId}`);
            // Soft update UI
            setDocs((prev) =>
                prev.map((doc) =>
                    doc._id === docId
                        ? { ...doc, status: 'processing', errorMessage: null }
                        : doc
                )
            );
        } catch (err) {
            console.error('Reprocess error:', err);
            setErrorMsg(
                err?.response?.data?.message ||
                'Failed to start reprocessing. Please check backend logs.'
            );
        } finally {
            setReprocessingId(null);
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
        <div className="admin-grid">
            {/* Overview + users */}
            <section className="card">
                <header className="card-header">
                    <div>
                        <h2 className="card-title">Admin overview</h2>
                        <p className="card-subtitle">
                            System-wide stats and list of registered users.
                        </p>
                    </div>
                    <span className="card-badge">Admin only</span>
                </header>

                {errorMsg && (
                    <div className="form-error" style={{ marginBottom: '0.6rem' }}>
                        {errorMsg}
                    </div>
                )}

                {/* Overview tiles */}
                <div className="stats-row" style={{ marginTop: '0.4rem' }}>
                    <div className="stat-card">
                        <div className="stat-label">Total users</div>
                        <div className="stat-value">
                            {loadingOverview || !overview ? '…' : overview.totalUsers}
                        </div>
                        <div className="stat-tag">Registered accounts</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total docs</div>
                        <div className="stat-value">
                            {loadingOverview || !overview ? '…' : overview.totalDocuments}
                        </div>
                        <div className="stat-tag">Uploaded by all users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">AI-ready</div>
                        <div className="stat-value">
                            {loadingOverview || !overview ? '…' : overview.readyDocuments}
                        </div>
                        <div className="stat-tag">Docs ready for chat</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Errors</div>
                        <div className="stat-value">
                            {loadingOverview || !overview ? '…' : overview.errorDocuments}
                        </div>
                        <div className="stat-tag">Need manual attention</div>
                    </div>
                </div>

                {/* Users table */}
                <div style={{ marginTop: '1.1rem' }}>
                    <div className="card-subtitle" style={{ marginBottom: '0.35rem' }}>
                        Users
                    </div>
                    {loadingUsers && (
                        <div className="form-helper">Loading users…</div>
                    )}
                    {!loadingUsers && users.length === 0 && (
                        <div className="form-helper">No users found yet.</div>
                    )}
                    {!loadingUsers && users.length > 0 && (
                        <div style={{ overflowX: 'auto', marginTop: '0.2rem' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Plan</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u._id}>
                                            <td>{u.name}</td>
                                            <td>{u.email}</td>
                                            <td>{u.role}</td>
                                            <td>{u.plan}</td>
                                            <td>{formatDate(u.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* Documents table */}
            <section className="card card--soft">
                <header className="card-header">
                    <div>
                        <h2 className="card-title">All documents</h2>
                        <p className="card-subtitle">
                            Monitor document status and re-run processing when needed.
                        </p>
                    </div>
                </header>

                {loadingDocs && (
                    <div className="form-helper">Loading documents…</div>
                )}

                {!loadingDocs && docs.length === 0 && (
                    <div className="form-helper">No documents uploaded yet.</div>
                )}

                {!loadingDocs && docs.length > 0 && (
                    <div style={{ overflowX: 'auto', marginTop: '0.4rem' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>File name</th>
                                    <th>User</th>
                                    <th>Status</th>
                                    <th>Pages</th>
                                    <th>Uploaded</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.slice(0, 30).map((doc) => (
                                    <tr key={doc._id}>
                                        <td>{doc.filename}</td>
                                        <td>
                                            {doc.userId?.name || '—'} <br />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-soft)' }}>
                                                {doc.userId?.email}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={statusBadgeClass(doc.status)}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td>{doc.pages || '—'}</td>
                                        <td>{formatDate(doc.createdAt)}</td>
                                        <td>
                                            <button
                                                className="btn btn--ghost"
                                                type="button"
                                                onClick={() => handleReprocess(doc._id)}
                                                disabled={reprocessingId === doc._id}
                                            >
                                                {reprocessingId === doc._id ? 'Reprocessing…' : 'Reprocess'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {docs.length > 30 && (
                            <div className="form-helper" style={{ marginTop: '0.4rem' }}>
                                Showing first 30 documents for demo. You can extend pagination in code.
                            </div>
                        )}
                    </div>
                )}

                <div className="form-helper" style={{ marginTop: '0.9rem', fontSize: '0.78rem' }}>
                    Project note: In viva, you can open this page and explain how MongoDB collections are
                    linked (User → Document → Chunk → Embedding) and how the admin can monitor the AI
                    pipeline.
                </div>
            </section>
        </div>
    );
}

export default AdminPanel;
