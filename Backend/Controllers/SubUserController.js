const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const UserModel = require('../Models/User');
const sendEmail = require('../Utils/sendEmail');

// Create sub-user under a parent user
exports.createSubUser = async (req, res) => {
  try {
    const parentId = req.user._id;

    const { name, email: rawEmail, password } = req.body;
    const email = rawEmail.toLowerCase();

    const existing = await UserModel.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: "Sub-user email already exists" });

    const hashedPass = await bcrypt.hash(password, 10);

    const subUser = new UserModel({
      name,
      email,
      password: hashedPass,
      role: 'sub-user',
      parentUser: parentId
    });

    await subUser.save();

    res.status(201).json({ success: true, message: "Sub-user created successfully", subUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all sub-users under parent
exports.getSubUsers = async (req, res) => {
  try {
    const subUsers = await UserModel.find({ parentUser: req.user._id });
    res.json({ success: true, subUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Force logout sub-user
exports.forceLogoutSubUser = async (req, res) => {
  try {
    const { subUserId } = req.params;

   const subUser = await UserModel.findOne({
      _id: subUserId,
      parentUser: req.user._id
    });
    if (!subUser) return res.status(404).json({ success: false, message: "Sub-user not found" });

    subUser.isLoggedIn = false;
    await subUser.save();

    res.json({ success: true, message: "Sub-user logged out successfully" });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Delete a sub-user
exports.deleteSubUser = async (req, res) => {
  try {
    const { subUserId } = req.params;

    // Only allow parent to delete their own sub-user
    const subUser = await UserModel.findOne({
      _id: subUserId,
      parentUser: req.user._id
    });

    if (!subUser) {
      return res.status(404).json({ success: false, message: "Sub-user not found or unauthorized" });
    }

    await subUser.deleteOne();

    res.json({ success: true, message: "Sub-user deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
