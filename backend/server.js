require('dotenv').config();
const logger = require('./src/logger');

process.on('uncaughtException', (err) => {
    logger.fatal('UNCAUGHT EXCEPTION! Shutting down...', { error: err });
    process.exit(1);
});

// Environment variable validation
const requiredEnvVars = [
    'PORT',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    logger.fatal(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

// Import app after env validation to ensure dependencies get the right config
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g. database connection failures)
process.on('unhandledRejection', (err) => {
    logger.fatal('UNHANDLED REJECTION! Shutting down...', { error: err.name, message: err.message, stack: err.stack });
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated!');
    });
});