// backend/src/controllers/authController.js
const supabase = require('../config/supabaseClient');
const logger = require('../logger');

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set();

// ============ SIGNUP ============
const signup = async (req, res, next) => {
    try {
        console.log('📝 Signup - Request received');

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: { message: 'Email and password are required', status: 400 }
            });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error('❌ Supabase signup error:', error);

            if (error.message.includes('already registered')) {
                return res.status(409).json({
                    error: { message: 'User already exists with this email', status: 409 }
                });
            }

            return res.status(400).json({
                error: { message: error.message, status: 400 }
            });
        }

        // ✅ SECURE: Log user ID instead of email
        logger.info(`✅ Successful signup for user ID: ${data.user.id}`);
        console.log(`✅ User created with ID: ${data.user.id}`);

        res.status(201).json({
            message: 'Signup successful',
            user: data.user
        });
    } catch (error) {
        console.error('❌ Signup error:', error);
        next(error);
    }
};

// ============ LOGIN ============
const login = async (req, res, next) => {
    try {
        console.log('📝 Login - Request received');

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: { message: 'Email and password are required', status: 400 }
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // ✅ SECURE: Log only that a login failed, not which email
            logger.warn(`❌ Failed login attempt - invalid credentials`);
            return res.status(401).json({
                error: { message: 'Invalid email or password', status: 401 }
            });
        }

        // ✅ SECURE: Log user ID instead of email
        logger.info(`✅ Successful login for user ID: ${data.user.id}`);
        console.log(`✅ User logged in with ID: ${data.user.id}`);

        res.status(200).json({
            message: 'Login successful',
            session: data.session,
            user: data.user
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        next(error);
    }
};

// ============ LOGOUT ============
const logout = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: { message: 'No token provided', status: 401 }
            });
        }

        if (tokenBlacklist.has(token)) {
            return res.status(200).json({ message: 'Already logged out' });
        }

        // Verify token is valid
        const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);

        if (verifyError || !user) {
            return res.status(401).json({
                error: { message: 'Invalid token', status: 401 }
            });
        }

        // Sign out from Supabase (local scope = only this session)
        const { error: signOutError } = await supabase.auth.admin.signOut(token, 'local');

        if (signOutError) {
            logger.warn(`❌ Failed to sign out token for user ID: ${user.id}`);
        }

        // Add to blacklist
        tokenBlacklist.add(token);

        // Auto-remove after token expires
        setTimeout(() => {
            tokenBlacklist.delete(token);
            console.log(`Token removed from blacklist after expiration`);
        }, 3600000);

        // ✅ SECURE: Log user ID instead of email
        logger.info(`✅ User ${user.id} logged out successfully`);
        console.log(`✅ User logged out with ID: ${user.id}`);

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('❌ Logout error:', error);
        next(error);
    }
};

// ============ GET CURRENT USER ============
const getCurrentUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: { message: 'No token provided', status: 401 }
            });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: { message: 'Invalid token', status: 401 }
            });
        }

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

// ============ CHECK BLACKLIST (Middleware) ============
const checkBlacklist = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token && tokenBlacklist.has(token)) {
            return res.status(401).json({
                error: { message: 'Token has been revoked', status: 401 }
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login,
    logout,
    getCurrentUser,
    checkBlacklist,
};