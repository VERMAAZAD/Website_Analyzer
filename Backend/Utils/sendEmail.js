// utils/sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: "smtp.gmail.com",
    secure: true,
    port: 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, text, html) => {
   
try {
    await transporter.sendMail({
        from: `"Affiliate Monitor" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
    });
    } catch (error) {
console.error("❌ Email send error:", error.message);
}
};

module.exports = sendEmail;
