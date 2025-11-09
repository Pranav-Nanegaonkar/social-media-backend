import expressAsyncHandler from "express-async-handler";
import moment from "moment";
import AppError from "../utils/AppError.js";
import supabase from "../config/supabaseClient.js";

/*
 ? @desc    Get all comments for a post
 ? @route   GET /api/comments/:postId
 ? @access  Public
*/
export const getAllComments = expressAsyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  // Validate postId
  if (!postId || isNaN(postId)) {
    return next(new AppError("Invalid or missing post ID", 400));
  }

  // Fetch comments + user info
  const { data: comments, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      users:userid (
        id,
        name,
        profilePic
      )
      `
    )
    .eq("postid", Number(postId))
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Supabase error while fetching comments:", error);
    return next(new AppError("Database error while fetching comments", 500));
  }

  return res.status(200).json({
    status: "success",
    message: "Comments fetched successfully",
    results: comments?.length || 0,
    data: comments || [],
  });
});

/*
 ? @desc    Create a new comment
 ? @route   POST /api/comments
 ? @access  Private
*/
export const createComment = expressAsyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  const { desc, postid } = req.body;

  // Validate fields
  if (!userId) {
    return next(new AppError("Unauthorized. Please log in first.", 401));
  }

  if (!postid || isNaN(postid)) {
    return next(new AppError("Invalid or missing post ID.", 400));
  }

  if (!desc || !desc.trim()) {
    return next(new AppError("Comment text cannot be empty.", 400));
  }

  const createdAt = moment().format("YYYY-MM-DD HH:mm:ss");

  // Insert new comment
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        desc: desc.trim(),
        createdAt,
        userid: userId, // Supabase column names are case-sensitive — ensure this matches your table
        postid: Number(postid),
      },
    ])
    .select("*")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return next(
      new AppError("Failed to create comment. Please try again.", 500)
    );
  }

  return res.status(201).json({
    status: "success",
    message: "Comment created successfully",
    data,
  });
});
