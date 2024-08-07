import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, " Invalid Video Id " );
  }
  const comments = await Comment.find({ video: videoId })
    .populate("user", "username")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .exec();

  const totalComments = await Comment.countDocuments({ video: videoId });
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { comments, totalComments, page, limit },
        " Comments Fetched Successfully "
      )
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { text } = req.body;
  const userAddingComment = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, " Invalid Video Id " );
  }
  const newComment = new Comment({
    video: videoId,
    user: userAddingComment,
    text,
  });

  await newComment.save();

  res
    .status(200)
    .json(new ApiResponse(200, newComment, " Comment Added Successfully " ));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { text } = req.body;
  const userUpdatingComment = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, " Comment Not Found " );
  }
  if (comment.user.toString() !== userUpdatingComment.toString()) {
    throw new ApiError(403, " You Are Not Allowed To Update This Comment " );
  }

  comment.text = text;
  await comment.save();

  res
    .status(200)
    .json(new ApiResponse(200, comment, " Comment Updated Successfully " ));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const userDelComment = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, " Invalid Comment Id " );
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, " Comment Not Found " );
  }

  if (comment.user.toString() !== userDelComment.toString()) {
    throw new ApiError(403, " You Are Not Allowed To Delete This Comment ");
  }
  await comment.remove();
  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
