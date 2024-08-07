import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannel,
  getWatchHistroy,
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlware.js";
import multer from "multer";
import { getVideoComments } from "../controllers/comment.controller.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refreshToken").post(refreshAccessToken);
router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/current-User").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
  .route("/updateAvatar")
  .patch(verifyJWT, upload.single("avatar", updateUserAvatar));
router
  .route("/updateCoverImage")
  .patch(verifyJWT, upload.single("coverImage", updateUserCoverImage));
router.route("/c/:username").get(verifyJWT, getUserChannel);
router.route("/watch-History").get(verifyJWT, getWatchHistroy);

//Comments
router.route("/comments/:videoId?page=1&limit=10").get(getVideoComments);
router.route("/comments/:videoId").get(addComment);
router.route("/comments/:commentId").delete(deleteComment);
router.route("/comments/:commentId").get(updateComment);



export default router;
