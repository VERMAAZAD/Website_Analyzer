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

const initiateLogin = async (req, res) => {
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

        const authCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // expires in 10 minutes

        user.authCode = authCode;
        user.authCodeExpiry = expiry;
        await user.save();

        await sendEmail(
            email,
            'Your Login Verification Code',
            `Your login code is: ${authCode}`,
            `<p>Your login code is: <strong>${authCode}</strong></p>`
        );

        res.status(200).json({ success: true, message: 'Verification code sent to your email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

const verifyLoginCode = async (req, res) => {
    try {
        const { email: rawEmail, code } = req.body;
        const email = rawEmail.toLowerCase();

        const user = await UserModel.findOne({ email });
        if (!user || user.authCode !== code || user.authCodeExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired code', success: false });
        }

        // Clear code fields after use
        user.authCode = undefined;
        user.authCodeExpiry = undefined;
        user.isLoggedIn = true;
        user.lastLogin = new Date();
        await user.save();

        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            success: true,
            jwtToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                parentUser: user.parentUser
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

// Controllers/AuthController.js
const sendEmail = require('../Utils/sendEmail');
const { generateResetEmailHTML } = require('../Utils/emailTemplates');

const requestPasswordReset = async (req, res) => {
    try {
        const { email: rawEmail } = req.body;
        const email = rawEmail.toLowerCase();

        const user = await UserModel.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "Email not found" });

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetCode = resetCode;
        user.resetCodeExpiry = expiry;
        await user.save();

		await sendEmail(
		email,
		'Your Password Reset Code',
		`Your reset code is: ${resetCode}`, // Fallback plain text
		generateResetEmailHTML(resetCode)   // Styled HTML
		);
        res.json({ success: true, message: "Reset code sent to email" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const resetPassword = async (req, res) => {
    try {
        const { email: rawEmail, code, newPassword } = req.body;
        const email = rawEmail.toLowerCase();

        const user = await UserModel.findOne({ email });
        if (!user || user.resetCode !== code || user.resetCodeExpiry < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset code" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetCode = undefined;
        user.resetCodeExpiry = undefined;

        await user.save();

        res.json({ success: true, message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};


module.exports = { signup, initiateLogin, verifyLoginCode, requestPasswordReset, resetPassword};
