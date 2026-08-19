// backend/server.js
const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
// ✅ IMPORTANT: These MUST be before routes
app.use(express.json()); // Parses JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

// ===== ROUTES =====
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ===== TEST BODY PARSING (Temporary - Remove after testing) =====
app.post('/test', (req, res) => {
    console.log('Test endpoint - Body received:', req.body);
    res.json({
        success: true,
        receivedBody: req.body,
        contentType: req.headers['content-type']
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            status: 404
        }
    });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);

    res.status(err.status || 500).json({
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
            status: err.status || 500
        }
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth/`);
});