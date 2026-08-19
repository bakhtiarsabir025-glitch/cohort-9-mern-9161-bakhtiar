const supabase = require('../config/supabaseClient');
const logger = require('../logger');

const signup = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: { message: 'Email and password are required', status: 400 } });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        logger.info(`Successful signup for user: ${email}`);
        res.status(201).json({ message: 'Signup successful', user: data.user });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: { message: 'Email and password are required', status: 400 } });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            logger.warn(`Failed login attempt for user: ${email}`);
            return res.status(401).json({ error: { message: error.message, status: 401 } });
        }

        logger.info(`Successful login for user: ${email}`);
        res.status(200).json({ message: 'Login successful', session: data.session, user: data.user });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        // You could theoretically extract the token from headers to sign out that specific session, 
        // but often the client simply discards the token. For completeness:
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            // Note: Since we are using a server-side client with a service role, this global sign out
            // might affect the user globally if not careful, but Supabase auth.signOut usually needs 
            // the user's JWT to sign out their specific session. 
            // To properly sign out a user session, we would use the user's JWT. 
            // Here, we'll try to sign out the session if possible.
            // With Supabase v2, we can sign out via the admin API or just instruct the client to drop the token.
            const { error } = await supabase.auth.admin.signOut(token);
            if (error) {
                logger.warn(`Failed to sign out token: ${error.message}`);
            }
        }
        
        logger.info(`Successful logout`);
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login,
    logout,
};
