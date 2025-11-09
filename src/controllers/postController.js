import expressAsyncHandler from "express-async-handler";
import moment from "moment";
import AppError from "../utils/AppError.js";
import supabase from "../config/supabaseClient.js";

/*
 ? @desc    Get all posts (either by profile user or timeline feed)
 ? @route   GET /api/posts?profileUserid={id}
 ? @access  Private
*/
export const getAllPosts = expressAsyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  const { profileUserid } = req.query;

  if (!userId) {
    return next(new AppError("Unauthorized. Please log in first.", 401));
  }

  // If profileUserid is provided, validate it
  if (typeof profileUserid !== "undefined" && profileUserid !== null) {
    // If it's the string "undefined" (from client bug) treat as invalid
    if (String(profileUserid).toLowerCase() === "undefined") {
      return next(new AppError("Invalid profileUserid parameter", 400));
    }

    const parsed = Number(profileUserid);
    if (Number.isNaN(parsed)) {
      return next(new AppError("profileUserid must be a valid number", 400));
    }
  }

  try {
    let posts;
    let error;

    if (profileUserid) {
      // fetch posts for specific profile user
      posts = await supabase
        .from("posts")
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
        .eq("userid", Number(profileUserid))
        .order("createdAt", { ascending: false });

      // supabase returns { data, error }
      const { data, error: supErr } = posts;
      if (supErr) {
        console.error("Supabase posts fetch error (profile):", supErr);
        return next(new AppError("Database error while fetching posts", 500));
      }

      return res.status(200).json({
        status: "success",
        message: "Posts fetched successfully",
        results: data?.length || 0,
        data: data || [],
      });
    }

    // TIMELINE: get followed users, sanitize ids
    const { data: followedData, error: followErr } = await supabase
      .from("relationships")
      .select("followedUserid")
      .eq("followerUserid", userId);

    console.log(userId);

    console.log(followedData);

    if (followErr) {
      console.error("Supabase follow query error:", followErr);
      return next(new AppError("Failed to fetch relationships", 500));
    }

    // convert to numbers and filter out invalid values
    const followedIds = followedData
      ?.map((item) => item.followedUserid)
      .filter((item) => item !== null);

    console.log(followedIds);

    // include the user's own id and dedupe
    const feedUserIds = Array.from(new Set([Number(userId), ...followedIds]));

    // If feedUserIds somehow contains invalid values, filter them out
    const cleanFeedUserIds = feedUserIds.filter(
      (id) => typeof id === "number" && Number.isFinite(id)
    );

    // If cleanFeedUserIds is empty, return empty feed instead of calling .in([])
    if (cleanFeedUserIds.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "Posts fetched successfully",
        results: 0,
        data: [],
      });
    }

    // Fetch posts for all ids in feed
    const { data: postsData, error: postsErr } = await supabase
      .from("posts")
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
      .in("userid", cleanFeedUserIds)
      .order("createdAt", { ascending: false });

    if (postsErr) {
      console.error("Supabase posts fetch error (timeline):", postsErr);
      return next(new AppError("Database error while fetching posts", 500));
    }

    return res.status(200).json({
      status: "success",
      message: "Posts fetched successfully",
      results: postsData?.length || 0,
      data: postsData || [],
    });
  } catch (err) {
    console.error("Unexpected error in getAllPosts:", err);
    return next(new AppError("Internal server error", 500));
  }
});

/*
 ? @desc    Create a new post
 ? @route   POST /api/posts
 ? @access  Private
*/
export const createPost = expressAsyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  const { desc, img } = req.body;

  // Validate user
  if (!userId) {
    return next(new AppError("Unauthorized. Please log in first.", 401));
  }

  // Validate content
  if (!desc?.trim() && !img?.trim()) {
    return next(new AppError("Post must contain text or an image.", 400));
  }

  const createdAt = moment().format("YYYY-MM-DD HH:mm:ss");

  // Insert post into Supabase
  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        desc: desc?.trim() || null,
        img: img?.trim() || null,
        userid: userId,
        createdAt,
      },
    ])
    .select("*")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return next(new AppError("Failed to create post. Please try again.", 500));
  }

  return res.status(201).json({
    status: "success",
    message: "Post created successfully",
    data,
  });
});
