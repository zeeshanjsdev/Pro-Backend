import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// export const verifyJWT = asyncHandler(async (req, res, next) => {
//   try {
//     const token =
//     req.cookies?.accessToken ||
//     req.header("Authorization")?.replace("Bearer ", "").trim(); // Trim whitespace

//     if (!token) {
//       throw new ApiError(401, "Unauthorised Request");
//     }
//     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

//     const user = await User.findById(decodedToken?._id).select(
//       "-password -refreshToken"
//     );

//     if (!user) {
//       throw new ApiError(401, "invalid access token");
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     throw new ApiError(400, "Token verification");
//   }
// });

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "").trim();

    console.log("Request Headers:", req.headers);
    console.log("Request Cookies:", req.cookies);

    console.log("Token extracted:", token);

    if (!token) {
      console.error("Token not found in request");
      throw new ApiError(401, "Unauthorized Request");
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log("Decoded Token:", decodedToken);
    } catch (err) {
      console.error("Error verifying token:", err.message);
      throw new ApiError(401, "Invalid access token");
    }

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      console.error("User not found for ID:", decodedToken?._id);
      throw new ApiError(401, "Invalid access token");
    }

    console.log("User found:", user);

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    throw new ApiError(400, "Something went wrong");
  }
});
