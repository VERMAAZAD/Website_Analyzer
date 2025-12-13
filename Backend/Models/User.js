const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'sub-user'], default: 'user' },
    parentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resetCode: { type: String },
    resetCodeExpiry: { type: Date },
    authCode: { type: String },
    authCodeExpiry: { type: Date },
    ssoSessionToken: { type: String, index: true },
    ssoExpiry: { type: Number },
    isLoggedIn: { type: Boolean, default: false },
    lastLogin: { type: Date },
});


module.exports = mongoose.model('User', userSchema);
