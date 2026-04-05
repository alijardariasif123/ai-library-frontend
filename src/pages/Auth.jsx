// File: frontend/src/pages/Auth.jsx
// Beautiful Auth page (Login + Register) with glowing theme

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

function AuthPage() {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');

    const { login } = useAuth();
    const location = useLocation();

    const toggleMode = (nextMode) => {
        setMode(nextMode);
        setErrorMsg('');
        setInfoMsg('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setInfoMsg('');
        setLoading(true);

        try {
            if (mode === 'register') {
                const res = await api.post('/auth/register', {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password
                });
                setInfoMsg('Account created! You can log in now.');
                // Auto login:
                if (res.data?.tokens) {
                    login(res.data);
                }
            } else {
                // login
                const res = await api.post('/auth/login', {
                    email: form.email.trim(),
                    password: form.password
                });
                login(res.data);
            }
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                (mode === 'register' ? 'Failed to register user.' : 'Failed to login.');
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    const fromRoute = location.state?.from?.pathname;

    return (
        <div className="auth-wrapper">
            {/* Left: hero / marketing side */}
            <section className="auth-hero">
                <div>
                    <h1 className="auth-hero-title">
                        Exam prep with <span className="auth-hero-gradient">Study Assistant AI</span>
                    </h1>
                    <p className="auth-hero-subtitle">
                        Upload your textbooks, notes and PDFs – let AI highlight important topics, create
                        summaries, MCQs, and Hindi explanations in seconds.
                    </p>

                    <ul className="auth-hero-list">
                        <li>Find exam-focused topics without reading every page</li>
                        <li>Ask doubts in English or Hindi, get clear explanations</li>
                        <li>Generate MCQs with correct answers & short reasoning</li>
                        <li>Chat with your own AI tutor trained on your material</li>
                    </ul>
                </div>

                <div>
                    <div className="auth-hero-tag">
                        ✨ Tip: Best used 1 week before exams to cover full syllabus quickly.
                    </div>
                </div>
            </section>

            {/* Right: auth form */}
            <section className="auth-form-panel">
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
                        onClick={() => toggleMode('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
                        onClick={() => toggleMode('register')}
                    >
                        Sign up
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="form-field">
                            <label className="form-label" htmlFor="name">
                                Full name
                            </label>
                            <input
                                id="name"
                                name="name"
                                className="form-input"
                                placeholder="Asif Ali"
                                autoComplete="name"
                                value={form.name}
                                onChange={handleChange}
                                required={mode === 'register'}
                            />
                            <div className="form-helper">Your name will be shown in the profile and admin panel.</div>
                        </div>
                    )}

                    <div className="form-field">
                        <label className="form-label" htmlFor="email">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label className="form-label" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                        <div className="form-helper">Use at least 6 characters. For project demo it&apos;s enough.</div>
                    </div>

                    {errorMsg && <div className="form-error">{errorMsg}</div>}
                    {infoMsg && !errorMsg && <div className="form-helper">{infoMsg}</div>}

                    <div className="form-actions">
                        <button className="btn btn--primary" type="submit" disabled={loading}>
                            {loading
                                ? mode === 'login'
                                    ? 'Logging you in…'
                                    : 'Creating account…'
                                : mode === 'login'
                                    ? 'Login'
                                    : 'Create account'}
                        </button>
                        {fromRoute && (
                            <span className="form-helper">
                                You will be redirected back to <span className="code-tag">{fromRoute}</span>
                            </span>
                        )}
                    </div>
                </form>

                <div className="form-helper">
                    Project note: This is a BCA final year project UI. You can show this page in your viva to
                    explain authentication (JWT, bcrypt, MongoDB).
                </div>
            </section>
        </div>
    );
}

export default AuthPage;
