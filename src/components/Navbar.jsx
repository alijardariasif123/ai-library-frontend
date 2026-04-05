// File: frontend/src/components/Navbar.jsx
// Top navigation bar with glowing theme & responsive layout

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../App.jsx';

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <header className="nav-root">
            <div className="nav-inner">
                {/* Logo + Brand */}
                <div className="nav-brand">
                    <div className="nav-logo">
                        <span className="nav-logo__spark" />
                        <span className="nav-logo__text-main">Study</span>
                        <span className="nav-logo__text-highlight">AI</span>
                    </div>
                    <div className="nav-subtitle">Read smarter. Revise faster.</div>
                </div>

                {/* Main navigation */}
                {user && (
                    <nav className="nav-links">
                        <NavLink
                            to="/dashboard"
                            className={`nav-link ${isActive('/dashboard') ? 'nav-link--active' : ''}`}
                        >
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/upload"
                            className={`nav-link ${isActive('/upload') ? 'nav-link--active' : ''}`}
                        >
                            Upload
                        </NavLink>

                        <NavLink
                            to="/chat"
                            className={`nav-link ${isActive('/chat') ? 'nav-link--active' : ''}`}
                        >
                            AI Tutor
                        </NavLink>

                        <NavLink
                            to="/payments"
                            className={`nav-link ${isActive('/payments') ? 'nav-link--active' : ''}`}
                        >
                            Plans
                        </NavLink>

                        {user.role === 'admin' && (
                            <NavLink
                                to="/admin"
                                className={`nav-link ${isActive('/admin') ? 'nav-link--active' : ''}`}
                            >
                                Admin
                            </NavLink>
                        )}
                    </nav>
                )}

                {/* Right side: user badge + actions */}
                <div className="nav-right">
                    {user ? (
                        <>
                            <div className="nav-user">
                                <div className="nav-user__avatar">
                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="nav-user__info">
                                    <div className="nav-user__name">{user.name}</div>
                                    <div
                                        className={`nav-user__plan nav-user__plan--${user.plan === 'premium' ? 'premium' : 'free'
                                            }`}
                                    >
                                        {user.plan === 'premium' ? 'Premium' : 'Free'}
                                    </div>
                                </div>
                            </div>
                            <button className="nav-btn nav-btn--ghost" onClick={logout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <NavLink to="/auth" className="nav-btn nav-btn--primary">
                            Login
                        </NavLink>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;
