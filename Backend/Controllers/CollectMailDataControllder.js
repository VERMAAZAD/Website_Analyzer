const CollectEmailData = require("../Models/CollectMailDataModel");
const {
  isValidEmailFormat,
  hasMxRecord,
  isDisposable
} = require("../Utils/emailValidators");

exports.subscribeUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    const landingPageUrl = req.headers["referer"] || "unknown";

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

   const existingUser = await CollectEmailData.findOne({ email });

    if (existingUser) {
      return res.status(200).json({ success: true, message: "Welcome back!" });
    }

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

    const newUser = new CollectEmailData({ name, email, landingPageUrl });
    await newUser.save();

    res.json({ success: true, message: "User saved successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await CollectEmailData.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
