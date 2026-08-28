const logger = require('../logger');
const AppError = require('../utils/AppError');

const handleJoiValidationError = (err) => {
    // Extract field-specific errors from Joi
    const errors = Object.values(err.details).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleDuplicateKeyError = (err) => {
    // Attempt to extract the duplicate field from the detail message (e.g., "Key (email)=(test@test.com) already exists.")
    const field = err.detail ? err.detail.match(/(["'])(?:(?=(\\?))\2.)*?\1/) : 'field';
    const message = `Duplicate field value: ${field}. Please use another value!`;
    return new AppError(message, 400);
};

const handleForeignKeyConstraintError = () => {
    return new AppError('The referenced record does not exist or has been deleted.', 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);
const handlePGRST116Error = () => new AppError('The requested resource was not found.', 404); // Supabase specific single row not found error

const sendErrorDev = (err, res) => {
    logger.error(`[ERROR] ${err.statusCode || 500} - ${err.message}`, { stack: err.stack });

    res.status(err.statusCode || 500).json({
        success: false,
        status: err.status || 'error',
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        // We log operational errors as warnings unless they are 500
        if (err.statusCode >= 500) {
            logger.error(`[ERROR] ${err.statusCode} - ${err.message}`);
        } else {
            logger.warn(`[WARN] ${err.statusCode} - ${err.message}`);
        }

        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });

        // Programming or other unknown error: don't leak error details
    } else {
        // 1) Log error
        logger.error(`[FATAL ERROR] 💥 ${err.message}`, { err });

        // 2) Send generic message
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        // Hard copy of error object for modification
        let error = Object.assign({}, err);
        error.message = err.message;
        error.name = err.name;
        error.code = err.code;

        // 1. Validation Errors (Joi)
        if (error.isJoi || error.name === 'ValidationError') {
            error = handleJoiValidationError(error);
        }

        // 2. Supabase / Postgres Errors
        // 23505: unique_violation
        if (error.code === '23505') {
            error = handleDuplicateKeyError(error);
        }
        // 23503: foreign_key_violation
        if (error.code === '23503') {
            error = handleForeignKeyConstraintError(error);
        }
        // PGRST116: JSON object requested, multiple (or no) rows returned
        if (error.code === 'PGRST116') {
            error = handlePGRST116Error();
        }

        // 3. Unauthorized / JWT Errors (Fallback if caught globally)
        if (error.name === 'JsonWebTokenError') {
            error = handleJWTError();
        }
        if (error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        }

        // 4. Fallback missing Not Found (e.g. forced 404 from routes)
        if (err.statusCode === 404 && !error.isOperational) {
            error = new AppError(err.message || 'Resource not found', 404);
        }

        sendErrorProd(error, res);
    }
};

module.exports = errorHandler;
