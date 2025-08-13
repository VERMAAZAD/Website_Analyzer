require('dotenv').config({ path: __dirname + '/../.env' });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../Models/User'); // update path as per your project


const MongoDB_URL = process.env.MONGO_CONN;
const ADMIN_NAME = process.env.ADMIN_NAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const createAdmin = async () => {
  try {
    await mongoose.connect(MongoDB_URL);

    const existing = await User.findOne({ email: 'admin@example.com' });
    if (existing) {
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10); // change password

    const adminUser = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    mongoose.disconnect();
  } catch (error) {
    mongoose.disconnect();
  }
};

createAdmin();
