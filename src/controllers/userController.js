import expressAsyncHandler from "express-async-handler";
import AppError from "../utils/AppError.js";
import supabase from "../config/supabaseClient.js";

/*
 ? @desc    Get user by ID
 ? @route   GET /api/users/:userid
 ? @access  Private or Public (depending on your design)
 */
export const getUser = expressAsyncHandler(async (req, res, next) => {
  const { userid } = req.params;

  // Validate input
  if (!userid || isNaN(userid)) {
    return next(new AppError("Invalid or missing user ID", 400));
  }

  // Fetch user from Supabase
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", Number(userid)) // make sure it's numeric
    .maybeSingle();


  // Handle Supabase error
  if (error) {
    console.error("Supabase error:", error);
    return next(new AppError("Database error while fetching user", 500));
  }

  // Handle user not found
  if (!data) {
    return next(new AppError("User not found", 404));
  }

  // Sanitize data (remove sensitive fields)
  const { password, ...safeData } = data;

  // Send success response
  return res.status(200).json({
    status: "success",
    message: "User fetched successfully",
    data: safeData,
  });
});

/*
 ? @desc    Update user profile
 ? @route   PUT /api/users/update
 ? @access  Private (requires auth)
 */
export const updateUser = expressAsyncHandler(async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError("Unauthorized. Please log in first.", 401));
  }

  const { name, city, website, profilePic, coverPic } = req.body;

  // Validate that at least one field is provided
  if (!name && !city && !website && !profilePic && !coverPic) {
    return next(new AppError("No update fields provided.", 400));
  }

  // Build an object with only provided fields
  const updateData = {};
  if (name) updateData.name = name.trim();
  if (city) updateData.city = city.trim();
  if (website) updateData.website = website.trim();
  if (profilePic) updateData.profilePic = profilePic.trim();
  if (coverPic) updateData.coverPic = coverPic.trim();

  // Update user in Supabase
  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select("id, name, city, website, profilePic, coverPic") // Return only safe fields
    .maybeSingle();

  // Handle Supabase error
  if (error) {
    console.error("Supabase error:", error);
    return next(new AppError("Error updating user", 500));
  }

  // Handle case where user not found
  if (!data) {
    return next(new AppError("User not found or no permission to update.", 403));
  }

  return res.status(200).json({
    status: "success",
    message: "User updated successfully.",
    data,
  });
});
