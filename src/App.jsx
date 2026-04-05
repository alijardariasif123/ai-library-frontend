// File: frontend/src/App.jsx
// Main App shell: routing, auth state, layout, navbar, protected routes

import React, { useEffect, useMemo, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import AuthPage from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UploadPage from './pages/Upload.jsx';
import ChatPage from './pages/Chat.jsx';
import PaymentsPage from './pages/Payments.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

import Navbar from './components/Navbar.jsx';
import { api } from './lib/api.js';

// ==============================
// 🔐 AUTH CONTEXT
// ==============================
const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

function loadStoredAuth() {
    try {
        const user = JSON.parse(localStorage.getItem('sa_user') || 'null');
        const tokens = JSON.parse(localStorage.getItem('sa_tokens') || 'null');
        if (!user || !tokens || !tokens.accessToken) return { user: null, tokens: null };
        return { user, tokens };
    } catch {
        return { user: null, tokens: null };
    }
}

function storeAuth(user, tokens) {
    if (user && tokens?.accessToken) {
        localStorage.setItem('sa_user', JSON.stringify(user));
        localStorage.setItem('sa_tokens', JSON.stringify(tokens));
    } else {
        localStorage.removeItem('sa_user');
        localStorage.removeItem('sa_tokens');
    }
}

// ==============================
// 🛡️ PROTECTED ROUTES
// ==============================
function ProtectedRoute({ children }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    return children;
}

function AdminRoute({ children }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    if (user.role !== 'admin') {
        return <Navigate to="/dashboard" replace state={{ from: location }} />;
    }

    return children;
}

// ==============================
// 🎨 MAIN APP LAYOUT
// ==============================
function AppInner() {
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null);
    const [bootstrapped, setBootstrapped] = useState(false);
    const [checkingRefresh, setCheckingRefresh] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Load auth from localStorage on first mount
    useEffect(() => {
        const { user: storedUser, tokens: storedTokens } = loadStoredAuth();
        if (storedUser && storedTokens?.accessToken) {
            setUser(storedUser);
            setTokens(storedTokens);
        }
        setBootstrapped(true);
    }, []);

    // Attach tokens to axios instance globally
    useEffect(() => {
        if (!tokens?.accessToken) return;

        api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    }, [tokens]);

    // Auto-refresh token (simple version)
    const refreshToken = async () => {
        if (!tokens?.refreshToken) return;
        try {
            setCheckingRefresh(true);
            const res = await api.post('/auth/refresh', {
                refreshToken: tokens.refreshToken
            });
            const newAccessToken = res.data?.accessToken;
            if (newAccessToken) {
                const updatedTokens = { ...tokens, accessToken: newAccessToken };
                setTokens(updatedTokens);
                storeAuth(user, updatedTokens);
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            }
        } catch (err) {
            console.error('Token refresh failed:', err);
            handleLogout();
        } finally {
            setCheckingRefresh(false);
        }
    };

    const handleLoginSuccess = (data) => {
        const { user: u, tokens: t } = data;
        setUser(u);
        setTokens(t);
        storeAuth(u, t);
        api.defaults.headers.common['Authorization'] = `Bearer ${t.accessToken}`;
        navigate('/dashboard', { replace: true });
    };

    const handleLogout = () => {
        setUser(null);
        setTokens(null);
        storeAuth(null, null);
        delete api.defaults.headers.common['Authorization'];
        navigate('/auth', { replace: true });
    };

    const authValue = useMemo(
        () => ({
            user,
            tokens,
            isAuthenticated: !!user,
            checkingRefresh,
            login: handleLoginSuccess,
            logout: handleLogout,
            refreshToken
        }),
        [user, tokens, checkingRefresh]
    );

    const isAuthRoute = location.pathname.startsWith('/auth');

    if (!bootstrapped) {
        return (
            <div className="app-root app-root--loading">
                <div className="app-loader">
                    <div className="app-loader__spinner" />
                    <div className="app-loader__text">
                        Booting up <span>Study Assistant AI</span>…
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={authValue}>
            <div className="app-root">
                {!isAuthRoute && <Navbar />}

                <main className={`app-main ${isAuthRoute ? 'app-main--auth' : ''}`}>
                    <Routes>
                        <Route
                            path="/"
                            element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />}
                        />

                        {/* Auth */}
                        <Route path="/auth" element={<AuthPage />} />

                        {/* Protected routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/upload"
                            element={
                                <ProtectedRoute>
                                    <UploadPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/chat"
                            element={
                                <ProtectedRoute>
                                    <ChatPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/payments"
                            element={
                                <ProtectedRoute>
                                    <PaymentsPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin"
                            element={
                                <AdminRoute>
                                    <AdminPanel />
                                </AdminRoute>
                            }
                        />

                        {/* Fallback 404 */}
                        <Route path="*" element={<div className="page-404">404 – Page Not Found</div>} />
                    </Routes>
                </main>
            </div>
        </AuthContext.Provider>
    );
}

export default AppInner;
