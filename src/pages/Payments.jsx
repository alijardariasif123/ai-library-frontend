// File: frontend/src/pages/Payments.jsx
// Plans & Razorpay payment integration (frontend side)

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

function PaymentsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const isPremium = user?.plan === 'premium';

    useEffect(() => {
        setStatusMsg('');
        setErrorMsg('');
    }, [user?.plan]);

    const handleUpgrade = async () => {
        setErrorMsg('');
        setStatusMsg('');

        if (isPremium) {
            setStatusMsg('You already have Premium plan active. 🎉');
            return;
        }

        setLoading(true);

        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                setErrorMsg('Failed to load Razorpay. Please check your internet connection.');
                setLoading(false);
                return;
            }

            // Create order on backend
            const res = await api.post('/payments/create-order', {
                amount: 19900 // 199 INR in paise (you can adjust)
            });

            const { order, razorpayKeyId } = res.data || {};
            if (!order || !razorpayKeyId) {
                throw new Error('Invalid order response from server.');
            }

            const options = {
                key: razorpayKeyId,
                amount: order.amount,
                currency: order.currency,
                name: 'Study Assistant AI',
                description: 'Premium Plan – Exam Focused AI Tutor',
                order_id: order.id,
                prefill: {
                    name: user?.name || 'Student',
                    email: user?.email || ''
                },
                notes: {
                    sa_userId: user?.id || '',
                    sa_plan: 'premium'
                },
                theme: {
                    color: '#5B8DFF'
                },
                handler: function () {
                    // Actual confirmation is done via Razorpay webhook on backend.
                    setStatusMsg(
                        'Payment successful! Premium will be activated shortly once Razorpay confirms the payment.'
                    );
                },
                modal: {
                    ondismiss: function () {
                        setStatusMsg('Payment window closed. You can try again anytime.');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error('Upgrade error:', err);
            setErrorMsg(
                err?.response?.data?.message ||
                'Failed to start payment. Please check backend Razorpay configuration.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <header className="card-header">
                <div>
                    <h2 className="card-title">Plans & billing</h2>
                    <p className="card-subtitle">
                        Upgrade to Premium to unlock higher limits and faster AI-powered exam preparation.
                    </p>
                </div>
                <span className="card-badge">
                    Current plan: {isPremium ? 'Premium ✨' : 'Free'}
                </span>
            </header>

            <div className="plan-grid">
                {/* Free Plan */}
                <div className="plan-card">
                    <div className="plan-name">Free plan</div>
                    <div className="plan-price">₹0</div>
                    <div className="plan-tagline">Perfect for trying out the project.</div>

                    <ul className="plan-feature-list">
                        <li>Upload a few documents</li>
                        <li>Basic AI Q&A</li>
                        <li>Summaries & topics (limited)</li>
                        <li>Hindi explanations (limited)</li>
                        <li>Ideal for project demo & viva</li>
                    </ul>

                    <div style={{ marginTop: '0.7rem' }}>
                        <button className="btn btn--ghost" type="button" disabled>
                            Current plan
                        </button>
                    </div>
                </div>

                {/* Premium Plan */}
                <div className="plan-card">
                    <div className="plan-name">Premium plan</div>
                    <div className="plan-price">₹199</div>
                    <div className="plan-tagline">Best for real exam preparation.</div>

                    <ul className="plan-feature-list">
                        <li>Higher upload & query limits</li>
                        <li>Fast OCR + AI processing</li>
                        <li>Unlimited summaries & topics</li>
                        <li>Full Hindi & English explanations</li>
                        <li>MCQ generation for self-testing</li>
                    </ul>

                    <div style={{ marginTop: '0.7rem' }}>
                        <button
                            className="btn btn--primary"
                            type="button"
                            onClick={handleUpgrade}
                            disabled={loading || isPremium}
                        >
                            {isPremium
                                ? 'Premium active ✨'
                                : loading
                                    ? 'Connecting to Razorpay…'
                                    : 'Upgrade to Premium'}
                        </button>
                    </div>
                </div>
            </div>

            {statusMsg && (
                <div className="form-helper" style={{ marginTop: '1rem' }}>
                    {statusMsg}
                </div>
            )}

            {errorMsg && (
                <div className="form-error" style={{ marginTop: '1rem' }}>
                    {errorMsg}
                </div>
            )}

            <div className="form-helper" style={{ marginTop: '1rem', fontSize: '0.78rem' }}>
                <strong>Project note:</strong> In a real app, Razorpay webhook will confirm payment and
                upgrade user plan in database. Here, you can show this page during viva to explain how
                payment gateway integration works.
            </div>
        </div>
    );
}

export default PaymentsPage;
