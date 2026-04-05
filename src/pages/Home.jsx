import React from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';

const Home = () => {
    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content">
                    <span className="badge">New: AI Powered V2.0</span>
                    <h1>Example <span className="highlight">Greatness</span><br />In Every Study Session.</h1>
                    <p>Don't just study hard, study smart. The only AI assistant you'll ever need to summarize, analyze, and master your coursework.</p>

                    <div className="cta-buttons">
                        <Link to="/auth" className="btn btn-primary">Start for Free</Link>
                        <Link to="/projects" className="btn btn-secondary">View Demo</Link>
                    </div>
                </div>

                <div className="hero-image">
                    <img src={heroImage} alt="Future of Learning" />
                </div>
            </section>

            <section className="features-section">
                <h2>Supercharge Your Workflow</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="icon">📄</div>
                        <h3>Instant Summaries</h3>
                        <p>Turn 100-page PDFs into 5-minute reads. Our AI extracts key concepts instantly.</p>
                    </div>
                    <div className="feature-card">
                        <div className="icon">🧠</div>
                        <h3>Active Recall Quizzes</h3>
                        <p>Stop forgetting. Generate MCQs automatically to test your knowledge retention.</p>
                    </div>
                    <div className="feature-card">
                        <div className="icon">💬</div>
                        <h3>Interactive Chat</h3>
                        <p>Have a conversation with your textbook. Ask specific questions and get cited answers.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
