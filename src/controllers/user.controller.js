import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";
import {ApiResponse} from '../../utils/apiResponse.js'
import { response } from "express";

const registerUser = asyncHandler(async (req, res) => {
  //     Registering User Logic
  // 1. get user details form frontend or Postman.
  // 2. Validation - not empty
  // 3. check if user already registered(by username or email).
  // 4. check for images - check for avatr.
  // 5. upload them to clodinary - avatar.
  // 8. create a user object - create entry in db.
  // 9. remove password and refresh token field from response.
  // 10. check for user creation.
  // 11. return response

  const { fullname, email, username, password } = req.body;
  console.log("email: ", email);

  //other method using array

  if ([fullname, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All field are required");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or password exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (avatarLocalPath) {
    throw new ApiError(400, "avatar file is requried");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar file is requried");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await user
    .findById(user._id)
    .select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res.status(201).json(

    new ApiResponse(200, createdUser, "user registered successfully")
  );


});

// one method
// if (fullname === '') {
//     throw new ApiError(400, "full name is required")
// } else {

// }
// });

export { registerUser };
