import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, res, next) => {
try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");
  
    if (!token) {
      throw new ApiError(401, "Unauthorised Request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKKEN_SECRET);
  
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
  
    if (!user) {
      // NEXT VIDEO : ABOUT FRONTEND:
  
      throw new ApiError(401, "invalid access token")
    }
  
    req.user = user;
    next()
} catch (error) {
  throw new ApiError(400, 'invalid access token')
  
}
});
