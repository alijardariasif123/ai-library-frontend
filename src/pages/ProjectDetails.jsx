import React from 'react';
import { Link } from 'react-router-dom';

const ProjectDetails = () => {
    return (
        <div className="project-details-container">
            <h1>About This Project</h1>
            <p className="intro">
                The <strong>AI-Powered Intelligent Study Assistant</strong> is a cutting-edge platform designed to revolutionize how students and professionals interact with learning materials.
            </p>

            <section className="detail-section">
                <h2>🛠️ Tech Stack</h2>
                <ul className="tech-list">
                    <li><strong>MERN Stack:</strong> MongoDB, Express.js, React, Node.js</li>
                    <li><strong>AI:</strong> Google Gemini API for natural language processing</li>
                    <li><strong>Queue:</strong> BullMQ & Redis for asynchronous background processing</li>
                    <li><strong>OCR:</strong> Python-based optical character recognition</li>
                    <li><strong>Payments:</strong> Razorpay integration</li>
                </ul>
            </section>

            <section className="detail-section">
                <h2>🚀 Key Features</h2>
                <div className="feature-list">
                    <div className="feature-item">
                        <h3>Document Processing</h3>
                        <p>Upload PDFs and let our OCR worker extract text with high precision.</p>
                    </div>
                    <div className="feature-item">
                        <h3>Vector Search</h3>
                        <p>Fast and accurate semantic search powered by MongoDB Vector Search.</p>
                    </div>
                    <div className="feature-item">
                        <h3>Secure Authentication</h3>
                        <p>JWT-based auth system with secure login and registration.</p>
                    </div>
                </div>
            </section>

            <div className="back-link">
                <Link to="/" className="btn btn-secondary">Back to Home</Link>
            </div>
        </div>
    );
};

export default ProjectDetails;
