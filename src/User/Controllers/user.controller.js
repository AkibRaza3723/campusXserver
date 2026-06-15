import bcrypt from "bcrypt";
import crypto from "crypto";
import redisClient from "../Models/redisclint.js";
import { User } from "../Models/user.model.js";
import { sendEmail } from "../../Utils/sendEmail.js";
import {asyncHandler} from "../../Utils/asyncHandler.js"

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
