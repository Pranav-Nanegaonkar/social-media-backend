import expressAsyncHandler from "express-async-handler";
import AppError from "../utils/AppError.js";
import supabase from "../config/supabaseClient.js";

/*
 ? @desc    Get all likes for a post
 ? @route   GET /api/likes?postid={id}
 ? @access  Public
*/
export const getLikes = expressAsyncHandler(async (req, res, next) => {
  const { postid } = req.query;

  // Validate postid
  if (!postid || isNaN(postid)) {
    return next(new AppError("Invalid or missing post ID.", 400));
  }

  // Fetch likes
  const { data, error } = await supabase
    .from("likes")
    .select("userid")
    .eq("postid", Number(postid));

  if (error) {
    console.error("Supabase error while fetching likes:", error);
    return next(new AppError("Database error while fetching likes", 500));
  }

  const userIds = (data || []).map((like) => like?.userid);


  return res.status(200).json({
    status: "success",
    message: "Likes fetched successfully",
    totalLikes: userIds.length,
    data: userIds,
  });
});

/*
 ? @desc    Add a like to a post
 ? @route   POST /api/likes?postid={id}
 ? @access  Private
*/
export const addLike = expressAsyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  const { postid } = req.query;

  // Validate input
  if (!userId) {
    return next(new AppError("Unauthorized. Please log in first.", 401));
  }

  if (!postid || isNaN(postid)) {
    return next(new AppError("Invalid or missing post ID.", 400));
  }

  // Check if already liked
  const { data: existingLike, error: likeErr } = await supabase
    .from("likes")
    .select("id")
    .eq("userid", userId)
    .eq("postid", Number(postid))
    .maybeSingle();

  if (likeErr) {
    console.error("Supabase check error:", likeErr);
    return next(new AppError("Database error while checking like", 500));
  }

  if (existingLike) {
    return next(new AppError("Post already liked", 400));
  }

  // Insert new like
  const { error } = await supabase
    .from("likes")
    .insert([{ userid: userId, postid: Number(postid) }]);

  if (error) {
    console.error("Supabase insert error:", error);
    return next(new AppError("Failed to like post. Please try again.", 500));
  }

  return res.status(201).json({
    status: "success",
    message: "Post liked successfully",
  });
});

/*
 ? @desc    Remove a like from a post
 ? @route   DELETE /api/likes?postid={id}
 ? @access  Private
*/
export const deleteLike = expressAsyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  const { postid } = req.query;

  // Validate input
  if (!userId) {
    return next(new AppError("Unauthorized. Please log in first.", 401));
  }

  if (!postid || isNaN(postid)) {
    return next(new AppError("Invalid or missing post ID.", 400));
  }

  // Attempt to delete
  const { error, count } = await supabase
    .from("likes")
    .delete({ count: "exact" }) // count deleted rows
    .eq("userid", userId)
    .eq("postid", Number(postid));

  if (error) {
    console.error("Supabase delete error:", error);
    return next(new AppError("Failed to unlike post. Please try again.", 500));
  }

  if (count === 0) {
    return next(new AppError("No like found to remove for this post.", 404));
  }

  return res.status(200).json({
    status: "success",
    message: "Post unliked successfully",
  });
});
