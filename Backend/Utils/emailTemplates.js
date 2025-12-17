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


exports.generateEmailHTML = (code) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Login Verification</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:'Segoe UI', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:520px; background:#ffffff; border-radius:14px; box-shadow:0 8px 30px rgba(0,0,0,0.08); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#3b82f6); padding:28px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600;">
                Login Verification
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; text-align:center;">
              <p style="font-size:15px; color:#374151; margin:0 0 12px;">
                Use the code below to securely log in to your account
              </p>

              <!-- OTP -->
              <div
                style="
                  display:inline-block;
                  margin:24px 0;
                  padding:14px 26px;
                  font-size:28px;
                  font-weight:700;
                  letter-spacing:6px;
                  color:#2563eb;
                  background:#eff6ff;
                  border:2px dashed #93c5fd;
                  border-radius:12px;
                ">
                ${code}
              </div>

              <p style="font-size:14px; color:#6b7280; margin:0;">
                This code will expire in <strong>10 minutes</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px; background:#f9fafb; text-align:center;">
              <p style="font-size:13px; color:#9ca3af; margin:0;">
                If you didn’t request this login, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
