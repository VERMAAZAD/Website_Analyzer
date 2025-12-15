const jwt = require("jsonwebtoken");
const User = require("../Models/User");

exports.ssoroute = async (req, res) => {
    try {
        const ssoToken = req.cookies?.ssoToken;

        if (!ssoToken) {
            return res.status(401).json({
                success: false,
                message: "SSO token missing"
            });
        }

        const user = await User.findOne({
            ssoSessionToken: ssoToken,
            ssoExpiry: { $gt: Date.now() }
        }).lean();

        if (!user) {
            return res.status(403).json({
                success: false,
                message: "SSO session expired"
            });
        }
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET missing");
        }
        const jwtToken = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                role: user.role,
                sso: true
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.cookie("ssoToken", user.ssoSessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "None",
            domain: process.env.NODE_ENV === "production" ? ".monitorchecker.com" : undefined,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
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
    } catch (err) {
        console.error("SSO Login Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
