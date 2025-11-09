import expressAsyncHandler from "express-async-handler";

import { generateToken } from "../utils/generateToken.js";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import supabase from "../config/supabaseClient.js";

/*
 ? @desc    Register new user
 ? @route   POST /api/auth/register
 ? @access  Public
*/
export const register = expressAsyncHandler(async (req, res, next) => {
  const { username, email, password, name } = req.body;

  // Validate fields
  if (!username || !email || !password || !name) {
    return next(new AppError("All fields are required", 400));
  }

  if (!validator.isEmail(email)) {
    return next(new AppError("Invalid email format", 400));
  }

  if (password.length < 8) {
    return next(
      new AppError("Password must be at least 8 characters long", 400)
    );
  }

  // Check if username already exists
  const { data: existingUser, error: userCheckError } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (userCheckError) {
    console.error("Supabase error:", userCheckError);
    return next(new AppError("Database error while checking username", 500));
  }

  if (existingUser) {
    return next(new AppError("Username is already taken", 409));
  }

  // Check if email already exists
  const { data: existingEmail, error: emailCheckError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (emailCheckError) {
    console.error("Supabase error:", emailCheckError);
    return next(new AppError("Database error while checking email", 500));
  }

  if (existingEmail) {
    return next(new AppError("An account with this email already exists", 409));
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Insert new user
  const { data: insertedUser, error: insertError } = await supabase
    .from("users")
    .insert([
      {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
      },
    ])
    .select("id")
    .single();

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return next(new AppError("Error while creating user", 500));
  }

  // Respond success
  return res.status(201).json({
    status: "success",
    message: "User registered successfully",
    userid: insertedUser.id,
  });
});

/*
 ? @desc    Login user
 ? @route   POST /api/auth/login
 ? @access  Public
*/
export const login = expressAsyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError("All fields are required", 400));
  }

  // Fetch user from Supabase
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Supabase error:", error);
    return next(new AppError("Database error while fetching user", 500));
  }

  if (!user) {
    return next(new AppError("Invalid credentials", 400));
  }

  // Compare password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return next(new AppError("Invalid credentials", 400));
  }

  // Generate JWT
  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    profilePic: user.profilePic,
    coverPic: user.coverPic,
    city: user.city,
    website: user.website,
  });

  // Send cookie + response
  res
    .cookie("accessToken", token, {
      httpOnly: true,
      secure: false, // change to true in production
      sameSite: "lax",
      path: "/",
    })
    .status(200)
    .json({
      status: "success",
      message: "User logged in successfully",
    });
});

/*
 ? @desc    Logout user
 ? @route   POST /api/auth/logout
 ? @access  Private
*/
export const logout = expressAsyncHandler(async (req, res, next) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false, // change to true in production
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return next(new AppError("Error during logout", 500));
  }
});

/*
 ? @desc    Check authentication
 ? @route   GET /api/auth/check
 ? @access  Private
*/
export const checkAuth = expressAsyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Fetch user
    const { data: userFromDB, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.id)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return next(new AppError("Database error while fetching user", 500));
    }

    if (!userFromDB) {
      return res.status(404).json({ isAuthenticated: false });
    }

    const { password, ...safeUser } = userFromDB;

    return res.status(200).json({
      isAuthenticated: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return res.status(403).json({ isAuthenticated: false });
  }
});
