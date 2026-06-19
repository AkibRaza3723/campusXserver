import { ApiError } from "../Utils/resError.js";
import { ApiRes } from "../Utils/response.js";
import { User } from "../User/Models/user.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const varifyJWT= asyncHandler(async(req,res,next)=>{
   try {
     const token = req.cookies?.accessToken; 
     if(!token){
         throw new ApiError(401,"Unauthorized request")
     }
     const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
     const user = await User.findById(decodedToken?._id).select("-refreshToken")
 
     if (!user) {
         throw new ApiError(401,"invalid access token")
     }
 
     req.user = user;
     next()
   } catch (error) {
     throw new ApiError(401, error?.message || "invalid access token catch")
   }// cookie mangwai req se usse user dhundha then req.user mei user ko daal dia 
})