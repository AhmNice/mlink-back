export const generateOTP_Email_Template = ({
  otp,
  name,
}: {
  otp: string;
  name: string;
}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OTP Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333333;
    }
    p {
      color: #555555;
      font-size: 16px;
      line-height: 1.5;
    }
    .otp {
      display: inline-block;
      background-color: #f0f0f0;
      border: 1px dashed #cccccc;
      padding: 10px 20px;
      font-size: 24px;
      letter-spacing: 4px;
      margin: 20px 0;
      border-radius: 6px;
      font-weight: bold;
    }
    .footer {
      font-size: 12px;
      color: #999999;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello ${name},</h1>
    <p>Use the OTP below to verify your account. This code is valid for 10 minutes.</p>
    <div class="otp">${otp}</div>
    <p>If you did not request this OTP, please ignore this email.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Market-Link. All rights reserved.
    </div>
  </div>
</body>
</html>`;
};
