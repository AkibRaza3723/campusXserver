import bcrypt from "bcrypt";
import crypto from "crypto";
import {redisClient} from "../../Utils/redisclint.js"
import { User } from "../Models/user.model.js";
import { sendEmail } from "../../Utils/sendemail.js";
import { asyncHandler } from "../../Utils/asyncHandler.js"

const requestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const plainTextOtp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = await bcrypt.hash(plainTextOtp, 10);

  await redisClient.set(`otp:${email}`, hashedOtp, { EX: 600 });

  await sendEmail({
  to: email,
  subject: "Your OTP code",
  text: `Your OTP is ${plainTextOtp}. It expires in 10 minutes.`,
  html: `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your OTP Code</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f4f4f5;
                    color: #333333;
                }
                .email-wrapper {
                    width: 100%;
                    background-color: #f4f4f5;
                    padding: 40px 0;
                }
                .email-content {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                }
                .header {
                    background-color: #111827;
                    padding: 24px;
                    text-align: center;
                }
                .header h1 {
                    color: #ffffff;
                    margin: 0;
                    font-size: 24px;
                    letter-spacing: 1px;
                }
                .body-content {
                    padding: 32px;
                }
                .body-content h2 {
                    margin-top: 0;
                    font-size: 20px;
                    color: #111827;
                }
                .body-content p {
                    font-size: 16px;
                    line-height: 1.5;
                    color: #4b5563;
                }
                .otp-container {
                    background-color: #f3f4f6;
                    border: 1px dashed #d1d5db;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 32px 0;
                }
                .otp-code {
                    font-size: 36px;
                    font-weight: bold;
                    color: #111827;
                    letter-spacing: 8px;
                    margin: 0;
                }
                .expiry-text {
                    font-size: 14px;
                    color: #ef4444;
                    text-align: center;
                    margin-top: -15px;
                    margin-bottom: 30px;
                    font-weight: 600;
                }
                .footer {
                    background-color: #f9fafb;
                    padding: 24px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                }
                .footer p {
                    margin: 0;
                    font-size: 12px;
                    color: #9ca3af;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                    <td align="center">
                        <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                                <td class="header">
                                    <h1>VANTISH</h1>
                                </td>
                            </tr>
                            
                            <tr>
                                <td class="body-content">
                                    <h2>Verify your login</h2>
                                    <p>Hello,</p>
                                    <p>You recently requested to sign in to your Vantish account. Please use the verification code below to complete your secure login.</p>
                                    
                                    <div class="otp-container">
                                        <p class="otp-code">${plainTextOtp}</p>
                                    </div>
                                    
                                    <p class="expiry-text">This code will expire in 10 minutes.</p>
                                    
                                    <p style="font-size: 14px;">If you did not request this code, please secure your account and ignore this email.</p>
                                </td>
                            </tr>
                            
                            <tr>
                                <td class="footer">
                                    <p>&copy; 2026 Vantish. All rights reserved.</p>
                                    <p>This is an automated message, please do not reply to this email.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
  });

  return res.status(200).json({ message: "OTP sent to your email" });
})

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const storedHash = await redisClient.get(`otp:${email}`);
  if (!storedHash) {
    return res.status(400).json({ message: "OTP is invalid or has expired" });
  }

  const isValidOtp = await bcrypt.compare(otp, storedHash);
  if (!isValidOtp) {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  await redisClient.del(`otp:${email}`);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, isVerified: true });
  } else if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }

  return res.status(200).json({ message: "OTP verified successfully", userId: user._id });
})


export {requestOtp,verifyOtp}
