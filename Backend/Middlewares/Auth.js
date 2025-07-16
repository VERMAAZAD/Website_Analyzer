
// const jwt = require('jsonwebtoken');
// const User = require('../Models/User');


// const ensureAuthenticated = async (req, res, next) => {
//     const auth = req.headers['authorization'];
//     if (!auth) {
//         return res.status(403)
//             .json({ message: 'Unauthorized, JWT token is require' });
//     }
//     try {
//         const decoded = jwt.verify(auth, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (err) {
//         return res.status(403)
//             .json({ message: 'Unauthorized, JWT token wrong or expired' });
//     }
// }

// module.exports = ensureAuthenticated;



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

        req.user = user; // Attach full user object to request
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Unauthorized, invalid or expired token' });
    }
};

module.exports = ensureAuthenticated;
