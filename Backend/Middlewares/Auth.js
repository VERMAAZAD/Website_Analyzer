    const jwt = require('jsonwebtoken');
    const User = require('../Models/User');

    const ensureAuthenticated = async (req, res, next) => {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(403).json({ message: 'Unauthorized, JWT token is required' });
        }

        const token = authHeader.split(' ')[1]; // Extract the token part

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded._id);
            if (!user) {
                return res.status(403).json({ message: 'Unauthorized, user not found' });
            }

            if (user.isLoggedIn === false) {
                return res.status(401).json({
                    message: 'Session expired. Please login again.'
                });
            }

            req.user = user; 
            req.userId = user._id; 
            next();
        } catch (err) {
            return res.status(403).json({ message: 'Unauthorized, invalid or expired token' });
        }
    };

    module.exports = ensureAuthenticated;