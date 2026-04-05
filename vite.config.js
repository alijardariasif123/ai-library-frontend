// File: frontend/vite.config.js
// Vite config for Study Assistant AI frontend
// - React plugin
// - Proxy /api calls to backend
// - Smooth DX

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// You can set VITE_BACKEND_URL in .env (for frontend)
// For dev, proxy will forward /api & /health requests to backend.
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: BACKEND_URL,
                changeOrigin: true
            },
            '/health': {
                target: BACKEND_URL,
                changeOrigin: true
            }
        }
    },
    preview: {
        port: 4173
    }
});
