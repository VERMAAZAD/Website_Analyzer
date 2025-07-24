exports.generateResetEmailHTML = (resetCode) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Password Reset</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; padding: 20px; }
        .container {
          max-width: 500px; margin: auto; background: #fff;
          padding: 30px; border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
        }
        h2 { color: #333; }
        .code {
          font-size: 24px; color: #3b82f6;
          background: #eef2ff; padding: 10px 20px;
          display: inline-block; border-radius: 8px;
          border: 1px dashed #3b82f6; margin: 20px 0;
        }
        .footer { color: #777; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Your Password</h2>
        <p>Use the code below to reset your password:</p>
        <div class="code">${resetCode}</div>
        <p class="footer">This code will expire in 10 minutes.<br>If you didn’t request this, you can ignore this email.</p>
      </div>
    </body>
  </html>
`;
