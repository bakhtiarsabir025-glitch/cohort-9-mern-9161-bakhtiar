const logger = require('../logger');

// Global error handler middleware
// Express requires exactly 4 arguments for error handling middleware
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error(err);

    // Determine the status code, default to 500
    const status = err.status || 500;
    
    // In production, do not leak the stack trace or internal error details for 500 errors
    const message = (process.env.NODE_ENV === 'production' && status === 500)
        ? 'Internal Server Error'
        : (err.message || 'Internal Server Error');

    res.status(status).json({
        error: {
            message,
            status,
        },
    });
};

module.exports = errorHandler;
