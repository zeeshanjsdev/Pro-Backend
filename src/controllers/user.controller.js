import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { response } from "express";
import { SchemaTypeOptions } from "mongoose";

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

  // 01 - Data From REQ BODY FROM POSTMAN

  const { fullName, email, username, password } = req.body;
  // console.log("email:", email);
  // console.log("fullName:", fullName);
  // console.log("username:", username);
  // console.log("password:", password);

  //other method using array

  // 02 - Validation - not empty

  if ([fullName, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All field are required");
  }

  // 03 - Check if user already registered(by username or email).
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or password exists");
  }

  // console.log(req.files);

  // 04 - Check for images - check for avatr.
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.lenngth > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // 06 - upload them to clodinary - avatar.

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is requried");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar file is requried");
  }

  // 07 - Create a user object - create entry in db.
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // 08- Remove password and refresh token field from response.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 09 - Check for user creation.
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  // 10 - Return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

// one method
// if (fullName === '') {
//     throw new ApiError(400, "full name is required")
// } else {

// }
// });

const loginUser = asyncHandler(async (req, res) => {
  // loging in user:

  // 1. getting data from req body.

  const { fullName, email, username, password } = req.body;

  // 2. username or email.
  if (!username || email) {
    throw new ApiError(400, "username or email is required");
  }

  // 3. find the user.
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // 4. password check.
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }
  const isPasswordValied = await user.isPasswordCorrect(password);
  if (!isPasswordValied) {
    throw new ApiError(401, "invalid user credentials");
  }

  // 5. access and refresh token.

  const generateAccessAndRefreshTokens = async (userId) => {
    try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.refreshToken();

      await user.save({ valiadateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(500, "something went wrong");
    }
  };
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // 6. send cookie

  const options = {
    httpOnly: true,
    secure: true,
  };

  // 7. return response.
  res
    .status(200)
    .cooke("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return response
    .status()
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

export { registerUser, loginUser, logoutUser };
