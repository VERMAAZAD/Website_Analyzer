const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const ensureAuthenticated = async (req, res, next) => {
  try {
    let user = null;
    let authSource = null;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        user = await User.findById(decoded._id);

        if (!user) throw new Error("User not found");

        if (!user.ssoExpiry || user.ssoExpiry < Date.now()) {
          throw new Error("SSO expired");
        }
        authSource = "jwt";

      } catch (err) {
        user = null;
      }
    }

    /* =========================
       2️⃣ SSO COOKIE FALLBACK
    ========================== */
    if (!user && req.cookies?.ssoToken) {
      user = await User.findOne({
        ssoSessionToken: req.cookies.ssoToken,
        ssoExpiry: { $gt: Date.now() },
      });
       if (user) authSource = "sso";
    }

    if (!user) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    req.user = user;
    req.userId = user._id;
    req.authSource = authSource;
    
    next();
  } catch (err) {
    return res.status(403).json({ message: "Unauthorized" });
  }
};

module.exports = ensureAuthenticated;
