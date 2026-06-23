import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  
  // OTP Fields stored at redis in controller for 10 mins...
  
  // Anonymous Profile
  username: { type: String, unique: true,
    sparse: true,
    required: true, // Allows nulls to be ignored by the unique index before onboarding
    trim: true 
  },
  avatar: {
    type: String,
    default: null 
  },
  isVerified: {
    type: Boolean, // set to true upon sucessful OTP
    default: false
  },
  reputation: {
    type: Number,
    default: 0
  },
  refreshToken: {
    type: [String],
    default: [],
  }
},{timestamps: true})


userSchema.methods.generateAccessToken = function () {
    const acesstoken = jwt.sign(
        {  
            _id: this._id,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    );
    return acesstoken;
};
userSchema.methods.generateRefreshToken = function () {
    const refreshToken = jwt.sign(
        { 
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    );
    return refreshToken;
};



export const User = mongoose.model("User", userSchema);