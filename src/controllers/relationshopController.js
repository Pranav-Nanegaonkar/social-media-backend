import expressAsyncHandler from "express-async-handler";
import AppError from "../utils/AppError.js";
import supabase from "../config/supabaseClient.js";

/*
 ? @desc    Get all followers of a user
 ? @route   GET /api/relationships?followedUserid={id}
 ? @access  Public
*/
export const getRelationship = expressAsyncHandler(async (req, res, next) => {
  const { followedUserid } = req.query;

  // Validate input
  if (!followedUserid || isNaN(followedUserid)) {
    return next(new AppError("Invalid or missing followedUserid ID.", 400));
  }

  // Fetch followers
  const { data, error } = await supabase
    .from("relationships")
    .select("followerUserid")
    .eq("followedUserid", Number(followedUserid));

  if (error) {
    console.error("Supabase relationship fetch error:", error);
    return next(new AppError("Database error while fetching followers", 500));
  }

  const followers = (data || []).map((r) => r?.followerUserid);

  return res.status(200).json({
    status: "success",
    message: "Followers fetched successfully",
    totalFollowers: followers.length,
    data: followers,
  });
});

/*
 ? @desc    Follow a user
 ? @route   POST /api/relationships?followedUserid={id}
 ? @access  Private
*/
export const addRelationship = expressAsyncHandler(async (req, res, next) => {
  const followerUserId = req.user?.id;
  const { followedUserid } = req.query;

  if (!followerUserId) {
    return next(new AppError("Unauthorized. Please log in first.", 401));
  }

  if (!followedUserid || isNaN(followedUserid)) {
    return next(new AppError("Invalid or missing followedUserid ID.", 400));
  }

  // Prevent self-follow
  if (Number(followedUserid) === followerUserId) {
    return next(new AppError("You cannot follow yourself.", 400));
  }

  // Check if relationship already exists
  const { data: existing, error: checkError } = await supabase
    .from("relationships")
    .select("id")
    .eq("followerUserid", followerUserId)
    .eq("followedUserid", Number(followedUserid))
    .maybeSingle();

  if (checkError) {
    console.error("Supabase check error:", checkError);
    return next(new AppError("Database error while checking relationship", 500));
  }

  if (existing) {
    return next(new AppError("Already following this user", 400));
  }

  // Insert new relationship
  const { error } = await supabase
    .from("relationships")
    .insert([{ followerUserid: followerUserId, followedUserid: Number(followedUserid) }]);

  if (error) {
    console.error("Supabase insert error:", error);
    return next(new AppError("Failed to follow user. Please try again.", 500));
  }

  return res.status(201).json({
    status: "success",
    message: "Followed successfully",
  });
});

/*
 ? @desc    Unfollow a user
 ? @route   DELETE /api/relationships?followedUserid={id}
 ? @access  Private
*/
export const deleteRelationship = expressAsyncHandler(async (req, res, next) => {
  const followerUserId = req.user?.id;
  const { followedUserid } = req.query;

  if (!followerUserId) {
    return next(new AppError("Unauthorized. Please log in first.", 401));
  }

  if (!followedUserid || isNaN(followedUserid)) {
    return next(new AppError("Invalid or missing followedUserid ID.", 400));
  }

  // Delete relationship
  const { error, count } = await supabase
    .from("relationships")
    .delete({ count: "exact" }) // returns number of rows deleted
    .eq("followerUserid", followerUserId)
    .eq("followedUserid", Number(followedUserid));

  if (error) {
    console.error("Supabase delete error:", error);
    return next(new AppError("Failed to unfollow user. Please try again.", 500));
  }

  if (count === 0) {
    return next(new AppError("No follower found to remove.", 404));
  }

  return res.status(200).json({
    status: "success",
    message: "Unfollowed successfully",
  });
});
