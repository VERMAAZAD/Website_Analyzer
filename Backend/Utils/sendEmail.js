// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        secure: true,
        port: 475, // or use SMTP config
        auth: {
            user: "bigmarketingserver@gmail.com",
            pass: "ydhh euod camy ddoy",
        },
    });

    await transporter.sendMail({
        from: "bigmarketingserver@gmail.com",
        to,
        subject,
        text,
        html,
    });
};

module.exports = sendEmail;
