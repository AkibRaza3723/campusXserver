import mongoose, { Schema } from "mongoose";


const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v.endsWith('ietlucknow.ac.in') || v.endsWith('st.jmi.ac.in');
      },
      message: props => `${props.value} is not a valid college email!`
    }
  },
  
  // OTP Fields
  otpHash: { type: String, default: null},
  otpExpiresAt: { type: Date,default: null},
  
  // Anonymous Profile
  username: { type: String, unique: true,
    sparse: true, // Allows nulls to be ignored by the unique index before onboarding
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
  }
},{timestamps: true})



export const User = mongoose.model("User", userSchema);