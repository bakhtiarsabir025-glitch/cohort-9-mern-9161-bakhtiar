const supabase = require('../config/supabaseClient');
const logger = require('../logger');

const signup = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: { message: 'Email and password are required', status: 400 },
            });
        }

        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            if (error.message.includes('already registered')) {
                return res.status(409).json({
                    error: { message: 'User already exists with this email', status: 409 },
                });
            }
            return res.status(400).json({ error: { message: error.message, status: 400 } });
        }

        logger.info(`Successful signup for user ID: ${data.user.id}`);
        res.status(201).json({ message: 'Signup successful', user: data.user });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: { message: 'Email and password are required', status: 400 },
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            logger.warn('Failed login attempt - invalid credentials');
            return res.status(401).json({ error: { message: error.message, status: 401 } });
        }

        logger.info(`Successful login for user ID: ${data.user.id}`);
        res.status(200).json({ message: 'Login successful', session: data.session, user: data.user });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: { message: 'No token provided', status: 401 } });
        }

        const { error } = await supabase.auth.admin.signOut(token, 'local');

        if (error) {
            throw error;
        }

        logger.info('Successful logout');
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        next(error);
    }
};

const getCurrentUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: { message: 'No token provided', status: 401 } });
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ error: { message: 'Invalid token', status: 401 } });
        }

        res.status(200).json({ user: data.user });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login,
    logout,
    getCurrentUser,
};