const requestIp = require("request-ip");
const geoip = require("geoip-lite");

const CollectEmailData = require("../Models/CollectMailDataModel");
const {
  isValidEmailFormat,
  hasMxRecord,
  isDisposable
} = require("../Utils/emailValidators");

exports.subscribeUser = async (req, res) => {
  try {
    const {userId, name, email, gender, age, category } = req.body;
    const landingPageUrl = req.headers["referer"] || "unknown";

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing user ID" });
    }

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

     const existingUser = await CollectEmailData.findOne({ email, userId });
    if (existingUser) {
      return res.status(200).json({ success: true, message: "Welcome back!" });
    };

    // Validate email
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (isDisposable(email)) {
      return res.status(400).json({ success: false, message: "Disposable emails not allowed" });
    }

    const mxValid = await hasMxRecord(email);
    if (!mxValid) {
      return res.status(400).json({ success: false, message: "Email domain not valid" });
    }

    // 🔹 Get client IP + Geo
    const clientIp = requestIp.getClientIp(req) || "unknown";
    const geo = geoip.lookup(clientIp) || {};

    // Save new user
    const newUser = new CollectEmailData({
      userId,
      name,
      email,
      gender,
      age,
      category,
      landingPageUrl,
      ip: clientIp,
      geo: {
        country: geo.country || "",
        region: geo.region || "",
        city: geo.city || "",
        lat: geo.ll ? geo.ll[0] : null,
        lon: geo.ll ? geo.ll[1] : null,
        timezone: geo.timezone || ""
      }
    });

    await newUser.save();

    res.json({ success: true, message: "SignUp successfully!" });
  } catch (err) {
    console.error("subscribeUser error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
     if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user._id;
    const userRole = req.user.role || "user";
    const { category } = req.query;

    let filter = {};
    if (userRole === "user") {
      filter.userId = userId;
    }

      if (category) {
      filter.category = category;
    }

    const users = await CollectEmailData.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// Delete user by ID
exports.deleteUser = async (req, res) => {
  try {
     if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role || "user";

    const user = await CollectEmailData.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
     if (userRole !== "admin" && !user.userId.equals(userId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    } 

    await CollectEmailData.findByIdAndDelete(id);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
