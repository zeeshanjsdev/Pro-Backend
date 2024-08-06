import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { response } from "express";
import { SchemaTypeOptions } from "mongoose";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
    req.files.coverImage.length > 0
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
    .status(200)
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
  if (!username && !email) {
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
      console.log("Retriving user with ID : ", userId);
      const user = await User.findById(userId);

      console.log("generating access token");
      const accessToken = user.generateAccessToken();

      console.log("generating Refresh token");
      const refreshToken = user.generateRefreshToken();

      console.log("saving without validation");
      await user.save({ validateBeforeSave: false });

      console.log("Tokens generated successfully");
      return { accessToken, refreshToken };
    } catch (error) {
      console.log("Error in generating ACC and REF token");
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
    .cookie("accessToken", accessToken, options)
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
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const inCommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!inCommingRefreshToken) {
    throw new ApiError(401, "UnAuthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      inCommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid Refresh Token");
    }

    if (inCommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access Token refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userChangingPassword = await User.findById(req.user?._id);
  const isPasswordCorrect =
    await userChangingPassword.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }

  userChangingPassword.password = newPassword;
  await userChangingPassword.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse("200", {}, "Password changed successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .jason(200, req.user, "Current User fetched Successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!(fullName || email)) {
    throw new ApiError(400, "All fields are required");
  }

  const userUpdatingDetails = ({ updatedFull } = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  )).select("-password");

  return res.status(200).json(new ApiResponse(200, "Account details updated"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing");
    await uploadOnCloudinary(avatarLocalPath);
  }

  if (!avatar.url) {
    throw new ApiError(400, "error while uploading avatar");
  }

  const userUpdatingAvatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status()
    .json(new ApiResponse(200, {}, "avatar image updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
    await uploadOnCloudinary(coverImageLocalPath);
  }

  if (!coverImage.url) {
    throw new ApiError(400, "error while uploading cover Image");
  }

  const userUpDatingCoverImage = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status()
    .json(new ApiResponse(200, {}, "cover image updated successfully"));
});

const getUserChannel = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      }
    },
    {
      $lookup: 
      {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        ChannelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        isSubscribed: 1,
        ChannelsSubscribedToCount: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if ( channel.length === 0 ) {
    throw new ApiError(400, "Channel doesnt exist");
  }
  console.log(channel);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel Fetched Successfully")
    );
});

const getWatchHistroy = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  }
                }
              ]
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ],
      },
    },
  ]);
  return res
  .status(200)
  .json(new ApiResponse(200 ,user[0].watchHistroy, "watchHistory fetched successfully"))
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannel,
  getWatchHistroy
};
