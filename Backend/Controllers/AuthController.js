const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../Models/User');

const signup = async (req, res) => {
    try {
         if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can create users', success: false });
        }
        
        const { name, email: rawEmail, password } = req.body;
        const email = rawEmail.toLowerCase();

        const user = await UserModel.findOne({ email });
        if (user) {
            return res.status(409).json({ message: 'User already exists', success: false });
        }

        const userModel = new UserModel({ name, email, password });
        userModel.password = await bcrypt.hash(password, 10);
        await userModel.save();

        res.status(201).json({
            message: "Signup successfully",
            success: true,
            user: {
                _id: userModel._id,
                name: userModel.name,
                email: userModel.email,
                role: userModel.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

const login = async (req, res) => {
    try {
        const { email: rawEmail, password } = req.body;
        const email = rawEmail.toLowerCase();

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(403).json({ message: 'Auth failed: email is incorrect', success: false });
        }

        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403).json({ message: 'Auth failed: password is incorrect', success: false });
        }

        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successfully",
            success: true,
            jwtToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

module.exports = { signup, login };
