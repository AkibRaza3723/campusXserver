import bcrypt from "bcrypt";
import crypto from "crypto";
import { redis } from "../../DB/connect.redis.js";
import { User } from "../Models/user.model.js";
import { sendEmail } from "../../Utils/sendemail.js";
import { asyncHandler } from "../../Utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { ApiError } from "../../Utils/resError.js";
import { ApiRes } from "../../Utils/response.js";
import { generateUniqueUserName } from "../../Utils/usernameGenerator.js";
import { otpKey } from "../../Utils/redisKey.js";
import verifiedEmail from "../../Utils/verifiedEmail.js";

const generateAcessTokenAndRefreshTokens = async (userId, oldRefreshToken = null) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        if (!Array.isArray(user.refreshToken)) {
            user.refreshToken = [];
        }

        if (oldRefreshToken) {
            // Find index of the old token and replace it for rotation
            const tokenIndex = user.refreshToken.indexOf(oldRefreshToken);
            if (tokenIndex > -1) {
                user.refreshToken[tokenIndex] = refreshToken;
            } else {
                user.refreshToken.push(refreshToken);//if any error occured or mysteriously oldrefreshtoken is deleted(safegaurd)
            }
        } else {
            // New login, push it
            user.refreshToken.push(refreshToken);
        }

        // Catch-all overflow check: ensure the array NEVER exceeds 2 elements
        while (user.refreshToken.length > 2) {
            user.refreshToken.shift();
        }

        await user.save({ validateBeforeSave: false }); //saving refresh token in user schema

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating tokens")
    }
}

const requestOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json(new ApiError(400, "Email is required"));
    }
    if (!verifiedEmail(email)) {
        return res.status(400).json(new ApiError(400, "Email is invalid"));
    }

    const plainTextOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(plainTextOtp, 10);

    await redis.set(`${otpKey(email)}`, hashedOtp, "EX", 300);

    await sendEmail({
        to: email,
        subject: "Your OTP code",
        text: `Your OTP is ${plainTextOtp}. It expires in 5 minutes.`,
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
    const username = await generateUniqueUserName();
    if (!email || !otp) {
        return res.status(400).json(new ApiError(400, "Email and OTP are required"));
    }
    if (!verifiedEmail(email)) {
        return res.status(400).json(new ApiError(400, "Email is invalid"));
    }

    const storedHash = await redis.get(`${otpKey(email)}`);
    if (!storedHash) {
        return res.status(400).json(new ApiError(400, "OTP is invalid or has expired"));
    }

    const isValidOtp = await bcrypt.compare(otp, storedHash);
    if (!isValidOtp) {
        return res.status(400).json(new ApiError(400, "Invalid OTP"));
    }

    await redis.del(`${otpKey(email)}`);

    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({ email, username, isVerified: true });
    } else if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
    }

    const { accessToken, refreshToken } = await generateAcessTokenAndRefreshTokens(user._id);
    //isko call krte hi refresh token DB mei gya ab at and rt frontend ko bhej do thorugh cookies
    const verifiedUser = await User.findById(user._id).select("-refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 10 //8days
    }//for security

    return res.status(200)
        .cookie("accessToken", accessToken, { ...options, maxAge: 1000 * 60 * 60 * 15 })
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiRes(200, { user: verifiedUser.toObject(), accessToken, refreshToken }, "user logged in sucesfully")
        ) //now user have access token and refresh token 
})

const logOut = asyncHandler(async (req, res) => {
    const incomingRT = req.cookies?.refreshToken;

    // We only pull the specific token from the array to log out from THIS device
    const updateQuery = incomingRT ? { $pull: { refreshToken: incomingRT } } : {}; //ternary operator one line if else

    await User.findByIdAndUpdate(
        req.user._id,
        updateQuery,
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }// for security 

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiRes(200, {}, "User logged out"))
})

const regenerateAccessToken = asyncHandler(async (req, res) => {
    const incomingRT = req.cookies.refreshToken;
    if (!incomingRT) {
        return res.status(401).json(new ApiError(401, "required to sign in"))
    }
    try {
        const decodedToken = jwt.verify(
            incomingRT,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)//we are providing _id of user when generating tokens in user.model.js
        if (!user) {
            return res.status(401).json(new ApiError(401, "unauthorized access"))
        }

        // Check if the incomingRT exists in the array instead of string comparison
        if (!user.refreshToken || !user.refreshToken.includes(incomingRT)) {
            return res.status(401).json(new ApiError(401, "refresh token is expired or used"))
        }

        // Pass the incomingRT to explicitly rotate ONLY that token
        const { accessToken, refreshToken: newrefreshToken } = await generateAcessTokenAndRefreshTokens(user._id, incomingRT)
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",//is only sended in https not in http
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 10 //10d
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, { ...options, maxAge: 1000 * 60 * 15 })//15m
            .cookie("refreshToken", newrefreshToken, options)
            .json(new ApiRes(
                200,
                { accessToken, refreshToken: newrefreshToken },
                "access token refreshed sucessfully"
            ))
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token - catch")
    }
})
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiRes(200, req.user, "current user fetch sucessfully"))
})

export { requestOtp, verifyOtp, logOut, regenerateAccessToken, getCurrentUser }
