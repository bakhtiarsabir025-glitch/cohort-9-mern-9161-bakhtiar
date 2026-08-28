const supabase = require('../config/supabaseClient');
const logger = require('../logger');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: { message: 'Missing or invalid Authorization header', status: 401 } });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: { message: 'Token missing', status: 401 } });
        }

        // Verify the token by fetching the user from Supabase
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ error: { message: 'Invalid token', status: 401 } });
        }

        // Attach the user and token to the request object
        req.user = data.user;
        req.token = token;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = authMiddleware;